import models from '../models'
import { VM, VMScript } from 'vm2'
import * as ccxt from 'ccxt'
import { EthereumApi } from '../ethereumApi'
import { indicators } from '../indicators'
import { taskQueue } from '../taskqueue'
import { config } from '../config/config'
import * as tf from '@tensorflow/tfjs'
import superagent from 'superagent'
import BigNumber from 'bignumber.js'

const wait1sec = () => new Promise(resolve => setTimeout(resolve, 1000))

export default class TradeSession {

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
    await models.tradelogs.create({type, msg, tradesessionId: this.options.id})
  }

  saveGraph = async (graph, key, value, timestamp) => {
    await models.tradegraphs.create({graph, key, value, timestamp, tradesessionId: this.options.id})
  }

  loader = async (toLoad: any) => {
    this.toLoad = toLoad
    // load exchanges
    if (toLoad.exchanges) {
      for (const exchange of toLoad.exchanges) {
        if (this.stopping !== "") {
          await this.close()
          return
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
          this.exchanges[exchange.exchange] = new ccxt[account.exchange.exchange]({
            apiKey: account.key,
            secret: account.secret,
            enableRateLimit: true
          })
          if (account.testnet === true) {
            this.exchanges[exchange.exchange].setSandboxMode(true)
          }
          for (const pair of exchange.pairs) {
            if (this.stopping !== "") {
              await this.close()
              return
            }
            this.loadingData.push({
              data: [],
              exchange: exchange.exchange,
              pair: pair.pair,
              timeframe: pair.timeframe
            })
          }
        } else {
          this.saveLog('error', 'Exchange not found '+exchange.exchange)
          this.stopping = 'loader error'
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
          const ethereumApi = new EthereumApi()
          this.ethereum[ethereum.wallet] = await ethereumApi.wallet(wallet, ethereum.injectedABIs ? ethereum.injectedABIs : undefined)
        } else {
          this.saveLog('error', 'Wallet not found '+ethereum.wallet)
          this.stopping = 'loader error'
        }
      }
    }
  }

  startTask = async () => {
    // load session
    this.session = await models.tradesessions.findOne({
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
    await models.tradesessions.update({started: new Date().getTime()}, {where:{id: this.options.id}})
    // check for script compile
    let script
    try {
      script = new VMScript(this.session.code, 'bot.js').compile();
    } catch (err) {
      await this.saveLog('error', err.message)
      this.stopping = 'code error'
    }
    // execute loader
    this.vm = new VM({
      timeout: 10000, // 10 sec vm.run?
    })
    try {
      // init script
      await this.vm.run(script)
    } catch (err) {
      await this.saveLog('error', err.message)
      this.stopping = 'code error'
    }
    try {
      // loader
      await this.loader(this.vm.run(`loader`))
    } catch (err) {
      await this.saveLog('error', err.message)
      this.stopping = 'loader error'
    }
    if (this.stopping !== "") {
      await this.close()
      return
    }
    // prepare sandbox
    const data = {}
    let timestampNow = new Date().getTime()
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
      },
      graph: {
        log: async (graph: string, key: any, value: any) => { await this.saveGraph(graph, key, value, timestampNow) }
      }
    }
    this.vm = new VM({
      sandbox,
      timeout: 1000, // 1 sec vm.run?
    })
    try {
      // init script
      try {
        await this.vm.run(script)
      } catch (e) {
        await this.saveLog('error', 'code '+e.message)
        this.stopping = 'code error'
      }
      try {
        await this.vm.run(`onStart()`)
      } catch (e) {
        await this.saveLog('error', 'onStart '+e.message)
      }
      // while we have ticks
      breaker:
      while (this.stopping === "") {
        const ticksOnSource = []
        for (const pairsource of this.loadingData) {
          if (this.stopping !== "") {
            break breaker
          }
          const response = await this.exchanges[pairsource.exchange].fetchOHLCV(pairsource.pair, pairsource.timeframe)
          if (response[0].length > 0) {
            let entry
            let maxTime = 0
            for (const res of response) {
              if (res[0] > maxTime) {
                maxTime = res[0]
                entry = res
              }
            }
            const pairdata = this.vm.run(`data`)[pairsource.exchange][pairsource.pair]
            if (pairdata.timestamp.length === 0) {
              await this.vm.run(`
                data['${pairsource.exchange}']['${pairsource.pair}'].timestamp.unshift(${entry[0]})
                data['${pairsource.exchange}']['${pairsource.pair}'].open.unshift(${entry[1]})
                data['${pairsource.exchange}']['${pairsource.pair}'].high.unshift(${entry[2]})
                data['${pairsource.exchange}']['${pairsource.pair}'].low.unshift(${entry[3]})
                data['${pairsource.exchange}']['${pairsource.pair}'].close.unshift(${entry[4]})
                data['${pairsource.exchange}']['${pairsource.pair}'].volume.unshift(${entry[5] ? entry[5] : 0})
              `)
              await models.tradeohlcs.create({
                source: `${pairsource.exchange}-${pairsource.pair}`,
                timestamp: entry[0],
                open: entry[1],
                high: entry[2],
                low: entry[3],
                close: entry[4],
                volume: entry[5] ? entry[5] : 0,
                tradesessionId: this.options.id
              })
              ticksOnSource.push({exchange: pairsource.exchange, pair: pairsource.pair})
            } else {
              if (maxTime === pairdata.timestamp[0] && (
                pairdata.close[0] !== entry[4] ||
                pairdata.volume[0] !== (entry[5] ? entry[5] : 0) ||
                pairdata.open[0] !== entry[1] ||
                pairdata.high[0] !== entry[2] ||
                pairdata.low[0] !== entry[3]
              )) {
                await this.vm.run(`
                  data['${pairsource.exchange}']['${pairsource.pair}'].open[0]=${entry[1]}
                  data['${pairsource.exchange}']['${pairsource.pair}'].high[0]=${entry[2]}
                  data['${pairsource.exchange}']['${pairsource.pair}'].low[0]=${entry[3]}
                  data['${pairsource.exchange}']['${pairsource.pair}'].close[0]=${entry[4]}
                  data['${pairsource.exchange}']['${pairsource.pair}'].volume[0]=${entry[5] ? entry[5] : 0}
                `)
                await models.tradeohlcs.update({
                  open: entry[1],
                  high: entry[2],
                  low: entry[3],
                  close: entry[4],
                  volume: entry[5] ? entry[5] : 0
                }, {
                  where: {
                    source: `${pairsource.exchange}-${pairsource.pair}`,
                    timestamp: entry[0],
                    tradesessionId: this.options.id
                  }
                })
                ticksOnSource.push({exchange: pairsource.exchange, pair: pairsource.pair, timestamp: entry[0]})
              }
              if (maxTime > pairdata.timestamp[0]) {
                await this.vm.run(`
                  data['${pairsource.exchange}']['${pairsource.pair}'].timestamp.unshift(${entry[0]})
                  data['${pairsource.exchange}']['${pairsource.pair}'].open.unshift(${entry[1]})
                  data['${pairsource.exchange}']['${pairsource.pair}'].high.unshift(${entry[2]})
                  data['${pairsource.exchange}']['${pairsource.pair}'].low.unshift(${entry[3]})
                  data['${pairsource.exchange}']['${pairsource.pair}'].close.unshift(${entry[4]})
                  data['${pairsource.exchange}']['${pairsource.pair}'].volume.unshift(${entry[5] ? entry[5] : 0})
                `)
                await models.tradeohlcs.create({
                  source: `${pairsource.exchange}-${pairsource.pair}`,
                  timestamp: entry[0],
                  open: entry[1],
                  high: entry[2],
                  low: entry[3],
                  close: entry[4],
                  volume: entry[5] ? entry[5] : 0,
                  tradesessionId: this.options.id
                })
                ticksOnSource.push({exchange: pairsource.exchange, pair: pairsource.pair, timestamp: entry[0]})
              }
            }
          }
        }
        try {
          timestampNow = new Date().getTime()
          await this.vm.run(`onTick({timestamp:${timestampNow}, data:${JSON.stringify(ticksOnSource)}})`)
        } catch (e) {
          await this.saveLog('error', 'onTick '+e.message)
        }
        if (ticksOnSource.length === 0) {
          await wait1sec()
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
    await models.tradesessions.update({
      ended: new Date().getTime(),
      reason: this.stopping ? this.stopping : 'finished'
    }, {
      where:{id: this.options.id}
    })
    this.finished()
  }

}
