import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { query, param, body, validationResult } from 'express-validator'
import * as ccxt from "ccxt"

export class ExchangesRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getExchangesInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async getExchanges (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Input validation failed.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
      return res.send({ status: 'error', message: 'No user' })
    }
    // query defaults
    let limit = 9999
    if (req.query.limit) {
      limit = parseInt(req.query.limit as any)
    }
    let offset = 0
    if (req.query.offset) {
      offset = parseInt(req.query.offset as any)
    }
    let where:any = {}
    if (req.query.search) {
      where = {
        name: {
          [models.Sequelize.Op.like]: `%${req.query.search}%`
        }
      }
    }
    const exchanges = await models.exchanges.findAndCountAll({
      where,
      offset,
      limit,
      order: [
        ['exchange']
      ]
    })
    return res.send({ status: 'success', exchanges: exchanges.rows, entries: exchanges.count })
  }

  getAccountsInputs = []

  public async getAccounts (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Input validation failed.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
      return res.send({ status: 'error', message: 'No user' })
    }
    const accounts = await models.accounts.findAndCountAll({
      attributes: ['id', 'name', 'key'],
      where: {
        userIdusers: user.idusers
      },
      include: [{
        model: models.exchanges
      }]
    })
    return res.send({ status: 'success', accounts: accounts.rows, entries: accounts.count })
  }

  newAccountInputs = [
    body('name').isAlphanumeric().notEmpty(),
    body('key').isString().notEmpty(),
    body('secret').isString().notEmpty(),
    body('testnet').isBoolean().notEmpty(),
    body('exchange').isString().notEmpty()
  ]

  public async newAccount (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // verify exchange
    const exchange = await models.exchanges.findOne({
      where: { id: req.body.exchange }
    })
    if (!exchange) {
      return res.send({ status: 'error', message: 'No exchange found' })
    }
    // test connection
    const ccxtExchange = new ccxt[exchange.exchange]({
      enableRateLimit: true,
      apiKey: req.body.key,
      secret: req.body.secret,
    })
    if (req.body.testnet === true) {
      ccxtExchange.setSandboxMode(true)
    }
    try {
      await ccxtExchange.fetchBalance()
    } catch (e) {
      const index = e.message.indexOf(' {');
      const message = JSON.parse(e.message.substring(index))
      return res.send({ status: 'error', message })
    }
    // create account
    const account = await models.accounts.create({
        name: req.body.name,
        key: req.body.key,
        secret: req.body.secret,
        testnet: req.body.testnet,
        userIdusers: user.idusers,
        exchangeId: exchange.id
    })
    // get pairs from exchange
    try {
      const symbols = []
      await ccxtExchange.loadMarkets()
      for (const symbolId in ccxtExchange.markets) {
        if (symbolId.startsWith('.')) {
          continue
        }
        symbols.push({
          pair: ccxtExchange.markets[symbolId].symbol,
          cid: symbolId,
          base: ccxtExchange.markets[symbolId].base,
          quote: ccxtExchange.markets[symbolId].quote,
          baseId: ccxtExchange.markets[symbolId].baseId,
          quoteId: ccxtExchange.markets[symbolId].quoteId,
          spot: ccxtExchange.markets[symbolId].spot === true ? true : false,
          userIdusers: user.idusers,
          accountId: account.id
        })
      }
      await models.pairs.bulkCreate(symbols, { ignoreDuplicates: true })
    } catch (e) {
      // console.log('get exchange symbols', e)
    }
    return res.send({ status: 'success', id: account.id })
  }

  deleteAccountInputs = [
    param('id').isString().notEmpty()
  ]

  public async deleteAccount (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // account
    const account = await models.accounts.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    if (!account) {
      return res.send({ status: 'error', message: 'No account found' })
    }
    // delete pairs
    await models.pairs.destroy({
      where: {
        accountId: account.id,
        userIdusers: user.idusers
      }
    })
    // delete account
    await models.accounts.destroy({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    return res.send({ status: 'success' })
  }

  getAccountInputs = [
    param('id').isString().notEmpty()
  ]

  public async getAccount (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // account
    const account = await models.accounts.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      },
      include: [{
        model: models.exchanges
      }]
    })
    if (!account) {
      return res.send({ status: 'error', message: 'No account found' })
    }
    // get exchange data
    const ccxtExchange = new ccxt[account.exchange.exchange]({
      apiKey: account.key,
      secret: account.secret,
    })
    if (account.testnet === true) {
      ccxtExchange.setSandboxMode(true)
    }
    // get balances
    let balances:any = {}
    const functions = typeof account.exchange.functions === 'object' ? account.exchange.functions : JSON.parse(account.exchange.functions)
    if (functions.fetchBalance && functions.fetchBalance !== "false") {
      balances = await ccxtExchange.fetchBalance()
    }
    // get positions
    let positions = []
    if (functions.fetchPositions && functions.fetchPositions !== "false") {
      positions = await ccxtExchange.fetchPositions()
    }
    // get orders
    let orders = []
    if (functions.fetchOrders && functions.fetchOrders !== "false") {
      orders = await ccxtExchange.fetchOrders()
    }
    // clear info obj
    const bal = {}
    for (const b in balances) {
      if (b !== 'free' && b !== 'total' && b !== 'used' && b !== 'info') {
        bal[b] = balances[b]
      }
    }
    // timeframe
    const timeframes = Object.keys(ccxtExchange.timeframes)
    return res.send({
      status: 'success',
      balances: bal,
      positions,
      orders,
      timeframes,
      functions,
      exchange: account
    })
  }

  init () {
    this.router.get('/available', this.getExchangesInputs, this.getExchanges)
    this.router.get('/', this.getAccountsInputs, this.getAccounts)
    this.router.post('/new',this.newAccountInputs, this.newAccount)
    this.router.delete('/:id',this.deleteAccountInputs, this.deleteAccount)
    this.router.get('/:id', this.getAccountInputs, this.getAccount)
  }
}

const exchangesRouter = new ExchangesRouter()
exchangesRouter.init()

export default exchangesRouter.router
