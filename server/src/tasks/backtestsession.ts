import models from '../models'
import { VM, VMScript } from 'vm2'
import * as ccxt from 'ccxt'
import { indicators } from '../indicators'
import { taskQueue } from '../taskqueue'
import { mockExchange } from '../mockExchange'
import { mockCrypto } from '../mockCrypto'
import { config } from '../config/config'
import * as tf from '@tensorflow/tfjs'
import superagent from 'superagent'
import BigNumber from 'bignumber.js'

export default class BacktestSession {

  loaderExchanges: any = {}
  loaderCrypto = new mockCrypto()
  exchanges: any = {}
  ethereum: any = {}
  loadingData: any[] = []
  stopping: string = ""
  finished
  vm
  session
  options
  toLoad

  constructor(job: any) {
    this.options = job.data
  }

  load = () => {
    return new Promise((resolve) => {
      this.finished = resolve
      this.startTask()
    });
  }

  saveLog = async (type: string, msg: any) => {
    await models.backtestlogs.create({type, msg, backtestsessionId: this.options.id})
  }

  loader = async (toLoad: any) => {
    this.toLoad = toLoad
    // load exchanges
    if (toLoad.exchanges) {
      for (const exchange of toLoad.exchanges) {
        if (this.stopping !== "") {
          await this.close()
        }
        const account = await models.accounts.findOne({
          where: {
            name: exchange.exchange,
            userIdusers: this.session.userIdusers
          },
          include: [{
            model: models.exchanges
          },{
            model: models.pairs
          }]
        })
        if (account) {
          this.loaderExchanges[exchange.exchange] = new ccxt[account.exchange.exchange]({
            apiKey: account.key,
            secret: account.secret,
            enableRateLimit: true
          })
          if (account.testnet === true) {
            this.loaderExchanges[exchange.exchange].setSandboxMode(true)
          }
          this.exchanges[exchange.exchange] = new mockExchange()
          await this.exchanges[exchange.exchange].init(account, exchange.balances ? exchange.balances : undefined)
          for (const pair of exchange.pairs) {
            if (this.stopping !== "") {
              await this.close()
              return
            }
            try {
              const ohlcs = []
              let since = new Date(pair.start).getTime()
              const endTime = new Date(pair.end).getTime()
              while (true) {
                if (this.stopping !== "") {
                  await this.close()
                  return
                }
                const newData = await this.loaderExchanges[exchange.exchange].fetchOHLCV(pair.pair, pair.timeframe, since, 1000)
                if (newData.length === 1 || newData.length === 0) {
                  break
                }
                since = newData[newData.length-1][0]
                for (const e of newData) {
                  if (e[0] > endTime || e[0] === endTime) {
                    break
                  }
                  ohlcs.push(e)
                }
              }
              this.loadingData.push({
                data: ohlcs,
                exchange: exchange.exchange,
                pair: pair.pair,
                timeframe: pair.timeframe
              })
            } catch (e) {
              this.saveLog('error', 'Failed to load '+pair.pair+' from '+ exchange.exchange)
              this.stopping = 'loader error'
              await this.close()
              return
            }
          }
        } else {
          this.saveLog('error', 'Exchange not found '+exchange.exchange)
          this.stopping = 'loader error'
          await this.close()
          return
        }
      }
    }
    // load ethereum
    if (toLoad.ethereum) {
      for (const ethereum of toLoad.ethereum) {
        if (this.stopping !== "") {
          await this.close()
          return
        }
        const wallet = await models.dexwallets.findOne({
          where: {
            name: ethereum.wallet,
            userIdusers: this.session.userIdusers
          }
        })
        if (wallet) {
          this.ethereum[ethereum.wallet] = await this.loaderCrypto.wallet(wallet, ethereum.balances ? ethereum.balances : undefined)
        } else {
          this.saveLog('error', 'Wallet not found '+ethereum.wallet)
          this.stopping = 'loader error'
        }
      }
    }
  }

  startTask = async () => {
    // load session
    this.session = await models.backtestsessions.findOne({
      where: { id: this.options.id }
    })
    // listen shutdown
    taskQueue.queue.on('global:completed', (id) => {
      if (id === this.session.id) {
        this.stopping = "user stop"
      }
    })
    process.on('SIGTERM', async () => {
      this.stopping = "system stop"
    })
    process.on('SIGINT', async () => {
      this.stopping = "system stop"
    })
    await models.backtestsessions.update({started: new Date().getTime()}, {where:{id: this.options.id}})
    // check for script compile
    let script
    try {
      script = new VMScript(this.session.code, 'bot.js').compile();
    } catch (err) {
      await this.saveLog('error', err.message)
    }
    // execute loader
    this.vm = new VM({
      timeout: 10000, // 10 sec vm.run?
    })
    try {
      // init script
      await this.vm.run(script)
      await this.loader(this.vm.run(`loader`))
    } catch (err) {
      await this.saveLog('error', err.message)
    }
    if (this.stopping !== "") {
      await this.close()
      return
    }
    // prepare sandbox
    const data = {}
    for (const entry of this.loadingData) {
      if (data[entry.exchange] === undefined) {
        data[entry.exchange] = {}
      }
      data[entry.exchange][entry.pair]={timestamp:[],open:[],high:[],low:[],close:[],volume:[]}
    }
    const sandbox = {
      indicators,
      data,
      exchanges: this.exchanges,
      ethereum: this.ethereum,
      tf: config.app.sandbox_tf ? tf : undefined,
      superagent: config.app.sandbox_superagent ? superagent : undefined,
      BigNumber: BigNumber,
      console: {
        log: async (...toLog: any[]) => { await this.saveLog('log', toLog) },
        info: async (...toLog: any[]) => { await this.saveLog('info', toLog) },
        warn: async (...toLog: any[]) => { await this.saveLog('warn', toLog) },
        error: async (...toLog: any[]) => { await this.saveLog('error', toLog) }
      }
    }
    this.vm = new VM({
      sandbox,
      timeout: 1000, // 1 sec vm.run?
    })
    try {
      // init script
      await this.vm.run(script)
      try {
        await this.vm.run(`onStart()`)
      } catch (e) {
        await this.saveLog('error', 'onStart '+e.message)
      }
      // while we have ticks
      breaker:
      while (this.stopping === "") {
        // find next tick
        let minTime = Number.MAX_SAFE_INTEGER
        for (const pairsource of this.loadingData) {
          if (pairsource.data.length > 0 && minTime > pairsource.data[0][0]) {
            minTime = pairsource.data[0][0]
          }
        }
        if (minTime === Number.MAX_SAFE_INTEGER) {
          break
        }
        // get all ticks
        const ticksOnSource = []
        for (const pairsource of this.loadingData) {
          if (this.stopping !== "") {
            break breaker
          }
          if (pairsource.data.length > 0 && minTime === pairsource.data[0][0]) {
            await this.vm.run(`
              data['${pairsource.exchange}']['${pairsource.pair}'].timestamp.unshift(${pairsource.data[0][0]})
              data['${pairsource.exchange}']['${pairsource.pair}'].open.unshift(${pairsource.data[0][1]})
              data['${pairsource.exchange}']['${pairsource.pair}'].high.unshift(${pairsource.data[0][2]})
              data['${pairsource.exchange}']['${pairsource.pair}'].low.unshift(${pairsource.data[0][3]})
              data['${pairsource.exchange}']['${pairsource.pair}'].close.unshift(${pairsource.data[0][4]})
              data['${pairsource.exchange}']['${pairsource.pair}'].volume.unshift(${pairsource.data[0][5]})
            `)
            await models.backtestohlcs.create({
              source: `${pairsource.exchange}-${pairsource.pair}`,
              timestamp: pairsource.data[0][0],
              open: pairsource.data[0][1],
              high: pairsource.data[0][2],
              low: pairsource.data[0][3],
              close: pairsource.data[0][4],
              volume: pairsource.data[0][5] ? pairsource.data[0][5] : 0,
              backtestsessionId: this.options.id
            })
            ticksOnSource.push({exchange: pairsource.exchange, pair: pairsource.pair, timestamp: pairsource.data[0][0]})
            pairsource.data.shift()
          }
        }
        if (this.stopping !== "") {
          break breaker
        }
        try {
          await this.vm.run(`onTick(${JSON.stringify(ticksOnSource)})`)
        } catch (e) {
          await this.saveLog('error', 'onTick '+e.message)
          this.stopping = "system stop"
          break breaker
        }
      }
    } catch (err) {
      await this.saveLog('error', err.message)
    }
    await this.close()
  }

  close = async () => {
    try {
      await this.vm.run(`onEnd()`)
    } catch (e) {
      await this.saveLog('error', 'onEnd '+e.message)
      this.stopping = 'error'
    }
    await models.backtestsessions.update({
      ended: new Date().getTime(),
      reason: this.stopping ? this.stopping : 'finished'
    }, {
      where:{id: this.options.id}
    })
    this.finished()
  }

}
