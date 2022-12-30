import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { validationResult } from 'express-validator'
import * as ccxt from "ccxt"
import { EthereumApi } from '../ethereumApi'

export class AssetsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getAssetsBySourceInputs = []

  public async getAssetsBySource (req: express.Request, res: express.Response) {
    // validations
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Input validation failed.', errors: result.mapped() })
    }
    // get logged user
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
      return res.send({ status: 'error', message: 'No user' })
    }
    // resolve return
    const dataToReturn = []
    // wallets
    const trackedTokens = await models.usersdextokens.findAll({
      include: {
        model: models.dextokens
      }
    })
    // get & loop accounts
    const wallets = await models.dexwallets.findAll({
      where: {userIdusers: user.idusers}
    })
    const ethereumApi = new EthereumApi()
    for (const wallet of wallets) {
      dataToReturn.push((async () => {
        const web3Account = await ethereumApi.wallet(wallet)
        const balances: any[] = []
        balances.push((async () => {
          const balance = (await web3Account.getBalance()).toString()
          return {name: 'ETH', id: '', balance, decimals: 18}
        })())
        for (const trackedToken of trackedTokens) {
          const balance = (await web3Account.token(trackedToken.dextoken.id).getBalance()).toString()
          if (balance === "0") continue
          balances.push((async () => {
            const balance = (await web3Account.token(trackedToken.dextoken.id).getBalance()).toString()
            return {name: trackedToken.dextoken.name, id: trackedToken.dextoken.id, symbol: trackedToken.dextoken.symbol, balance, decimals: trackedToken.dextoken.decimals}
          })())
        }
        const returningBalances = await Promise.all(balances)
        return {
          type: 'wallet',
          name: wallet.name,
          id: wallet.id,
          balances: returningBalances
        }
      })())
    }
    // exchanges
    const accounts = await models.accounts.findAll({
      where: {
        userIdusers: user.idusers
      },
      include: [{
        model: models.exchanges
      }]
    })
    for (const account of accounts) {
      dataToReturn.push((async () => {
        const ccxtExchange = new ccxt[account.exchange.exchange]({
          apiKey: account.key,
          secret: account.secret,
        })
        if (account.testnet === true) {
          ccxtExchange.setSandboxMode(true)
        }
        // get balances
        let balances
        const functions = typeof account.exchange.functions === 'object' ? account.exchange.functions : JSON.parse(account.exchange.functions)
        if (functions.fetchBalance && functions.fetchBalance !== "false") {
          balances = await ccxtExchange.fetchBalance()
        }
        // clear balances info obj
        const bal = {}
        for (const b in balances) {
          if (b !== 'free' && b !== 'total' && b !== 'used' && b !== 'info') {
            bal[b] = balances[b]
          }
        }
        return {
          type: 'exchange',
          name: account.name,
          id: account.id,
          balances: bal
        }
      })())
    }
    const assets = await Promise.all(dataToReturn)
    return res.send({ status: 'success', assets })
  }

  init () {
    this.router.get('/', this.getAssetsBySourceInputs, this.getAssetsBySource)
  }
}

const assetsRouter = new AssetsRouter()
assetsRouter.init()

export default assetsRouter.router
