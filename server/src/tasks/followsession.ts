import models from '../models'
import * as ccxt from 'ccxt'
import { EthereumApi } from '../ethereumApi'
import { taskQueue } from '../taskqueue'
import { ethers } from 'ethers'
import superagent from 'superagent'
import { config } from '../config/config'

const wait1min = () => new Promise(resolve => setTimeout(resolve, 60 * 1000))

export default class Blank {

  exchanges: any = {}
  ethereum: any = {}
  finished
  options
  stopping: string = ""
  session
  mapping
  walletSingature = ""
  walletMessage = ""
  timestart

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

  loadExchange = (index, account, noTrading = false) => {
    const ccxtExchange = new ccxt[account.exchange.exchange]({
      apiKey: account.key,
      secret: account.secret,
      enableRateLimit: true
    })
    if (account.testnet) {
      ccxtExchange.setSandboxMode(true)
    }
    return {
      createOrder: async (...args) => {
        return ccxtExchange.createOrder(...args)
      },
      createLimitBuyOrder: async (...args) => {
        return ccxtExchange.createLimitBuyOrder(...args)
      },
      createLimitSellOrder: async (...args) => {
        return ccxtExchange.createLimitSellOrder(...args)
      },
      createMarketBuyOrder: async (...args) => {
        return ccxtExchange.createMarketBuyOrder(...args)
      },
      createMarketSellOrder: async (...args) => {
        return ccxtExchange.createMarketSellOrder(...args)
      },
      cancelOrder: async (...args) => {
        return ccxtExchange.cancelOrder(...args)
      },
      fetchOrders: async (...args) => {
        return ccxtExchange.fetchOrders(...args)
      },
      fetchOpenOrders: async (...args) => {
        return ccxtExchange.fetchOpenOrders(...args)
      },
      fetchClosedOrders: async (...args) => {
        return ccxtExchange.fetchClosedOrders(...args)
      },
      fetchOrder: async (...args) => {
        return ccxtExchange.fetchOrder(...args)
      },
      fetchPositions: async (...args) => {
        return ccxtExchange.fetchPositions(...args)
      },
      fetchBalance: async (...args) => {
        return ccxtExchange.fetchBalance(...args)
      },
      fetchOHLCV: async (...args) => {
        return ccxtExchange.fetchOHLCV(...args)
      }
    }
  }

  loader = async () => {
    const mapping = this.session.mapping
    // load exchanges
    if (mapping.exchanges) {
      let exchangesToLoadIndex = 0
      for (const index in mapping.exchanges) {
        if (this.stopping !== "") {
          await this.close()
          return
        }
        const account = await models.accounts.findOne({
          where: {
            id: mapping.exchanges[index].id,
            userIdusers: this.session.userIdusers
          },
          include: [{
            model: models.exchanges
          },{
            model: models.pairs
          }]
        })
        if (account) {
          this.exchanges[index] = this.loadExchange(exchangesToLoadIndex, account, false)
        } else {
          this.saveLog('error', 'Exchange not found Exchange:'+index)
          this.stopping = 'loader error'
        }
        exchangesToLoadIndex++
      }
    }
    // load ethereum
    if (mapping.ethereum) {
      let walletToLoadIndex = 0
      for (const index in mapping.ethereum) {
        if (this.stopping !== "") {
          await this.close()
          return
        }
        const wallet = await models.dexwallets.findOne({
          where: {
            id: mapping.ethereum[index].id,
            userIdusers: this.session.userIdusers
          }
        })
        if (wallet) {
          const ethereumApi = new EthereumApi()
          this.ethereum[index] = await ethereumApi.wallet(wallet, undefined, {id: this.options.id, index: walletToLoadIndex, noTrading: false})
          walletToLoadIndex++
        } else {
          this.saveLog('error', 'Ethereum wallet not found: '+index)
          this.stopping = 'loader error'
        }
      }
    }
  }

  startTask = async () => {
    // load session
    this.session = await models.followtrading.findOne({
      where: { id: this.options.id },
      include: {
        model: models.dexwallets
      }
    })
    if (!this.session || !this.session.dexwallet) {
      this.stopping = "No session or wallet found"
      await this.close()
      return
    }
    // load signature
    const web3WalletSigner = await ethers.Wallet.fromMnemonic(this.session.dexwallet.seedphrase, "m/44'/60'/0'/0/" + this.session.dexwallet.walletindex)
    this.walletMessage = `I am owner of ${this.session.dexwallet.address}`
    this.walletSingature = await web3WalletSigner.signMessage(this.walletMessage)
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
    await models.followtrading.update({started: new Date().getTime()}, {where:{id: this.options.id}})
    // process loader
    await this.loader()
    // start retrieving actions
    this.timestart = new Date().getTime()
    breaker:
    while (this.stopping === "") {
      // fetch events
      const request = await superagent
        .post(`${config.app.baseUri}/api/v1/marketplace/${this.session.remoteId}/events`)
        .type('application/json')
        .send({
          signature: this.walletSingature,
          message: this.walletMessage,
          lastUpdate: this.timestart
        })
      this.timestart = new Date().getTime()
      // execute with mapping
      for (const action of request.body.data.reverse()) {
        if (action.data.type === 'ethereum') {
          if (this.ethereum[action.data.index] === undefined) {
            this.saveLog('error', 'Wallet: '+action.data.index+' not found')
            this.stopping = 'Wallet not found'
            break breaker
          }
          if (action.data.action.action === 'contractInteraction') {
            await this.ethereum[action.data.index].executeContractAction(
              action.data.action.address,
              [action.data.action.abi],
              action.data.action.abi.name,
              action.data.action.args
            )
          }
          if (action.data.action.action === 'transferEther') {
            await this.ethereum[action.data.index].transferEther(
              action.data.action.to,
              action.data.action.value
            )
            this.saveLog('info', action.data)
          }
        }
        if (action.data.type === 'exchange') {
          if (this.exchanges[action.data.index] === undefined) {
            this.saveLog('error', 'Exchange: '+action.data.index+' not found')
            this.stopping = 'Exchange not found'
            break breaker
          }
          await this.exchanges[action.data.index][action.data.action](action.data.actionArgs)
          this.saveLog('info', action.data)
        }
      }
      await wait1min()
    }
    await this.close()
  }

  close = async () => {
    await models.followtrading.update({
      ended: new Date().getTime(),
      reason: this.stopping ? this.stopping : 'finished'
    }, {
      where:{id: this.options.id}
    })
    this.finished()
  }

}
