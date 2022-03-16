import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import * as ccxt from 'ccxt'

export class PairsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getPairsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('include').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 10 }),
    query('offset').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }),
  ]

  public async getPairs (req: express.Request, res: express.Response) {
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
    // query defaults
    let limit = 20
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
        pair: {
          [models.Sequelize.Op.like]: `%${req.query.search}%`
        }
      }
    }
    if (req.query.include) {
      const includeArray = req.query.include.toString().split('-')
      where = {
        [models.Sequelize.Op.or]: {
          base: includeArray,
          quote: includeArray
        }
      }
    }
    where.userIdusers = user.idusers
    // get my pairs
    const pairs = await models.pairs.findAndCountAll({
        where,
        offset,
        limit,
        include: [{
          model: models.accounts,
          attributes: ['name'],
          include: [{
            model: models.exchanges,
            attributes: ['name']
          }]
        }]
    })
    return res.send({ status: 'success', pairs: pairs.rows, entries: pairs.count })
  }

  getPairInputs = [
    param('id').isLength({ min: 1, max: 50 }),
    query('timeframe').optional().notEmpty(),
    query('start').notEmpty(),
    query('end').notEmpty()
  ]

  public async getPair (req: express.Request, res: express.Response) {
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
    // get pair
    const pair = await models.pairs.findOne({
      where: {id: req.params.id},
      include: [{
        model: models.accounts,
        include: [{
          model: models.exchanges
        }]
      }]
    })
    // no pair
    if (pair === null) {
      return res.send({ status: 'error', message: 'No pair found' })
    }
    // not owner
    if (pair.userIdusers !== user.idusers) {
      return res.send({ status: 'error', message: 'Not owner' })
    }
    // pull data
    const broker = new ccxt[pair.account.exchange.exchange]({
      enableRateLimit: true,
      apiKey: pair.account.key,
      secret: pair.account.secret
    })
    if (pair.account.testnet === true) {
      broker.setSandboxMode(true)
    }
    // get balances
    let balances:any = {}
    const functions = typeof pair.account.exchange.functions === 'object' ? pair.account.exchange.functions : JSON.parse(pair.account.exchange.functions)
    if (functions.fetchBalance && functions.fetchBalance !== "false") {
      const rawBalances = await broker.fetchBalance()
      for (const balance in rawBalances) {
        if (
          pair.base === balance ||
          pair.quote === balance ||
          pair.baseId === balance ||
          pair.quoteId === balance
        ) {
          balances[balance] = rawBalances[balance]
        }
      }
    }
    // get positions
    let positions = []
    if (functions.fetchPositions && functions.fetchPositions !== "false") {
      positions = await broker.fetchPositions(pair.pair)
    }
    // get orders
    let orders = []
    if (functions.fetchOrders && functions.fetchOrders !== "false") {
      orders = await broker.fetchOrders(pair.pair)
    }
    // timeframe
    const timeframes = Object.keys(broker.timeframes)
    let timeframe
    if (req.query.timeframe && timeframes.includes(String(req.query.timeframe))) {
      timeframe = req.query.timeframe
    } else {
      timeframe = timeframes[1]
    }
    const ohlcs = []
    let since = Number(req.query.start)
    const endTime = Number(req.query.end)
    while (true) {
      const newData = await broker.fetchOHLCV(pair.pair, timeframe, since, 1000)
      if (newData.length === 1 || newData.length === 0) {
        break
      }
      since = newData[newData.length-1][0]
      for (const e of newData) {
        if (e[0] > endTime || e[0] === endTime) {
          break
        }
        ohlcs.push({
          timestamp: e[0],
          open: e[1],
          high: e[2],
          low: e[3],
          close: e[4],
          volume: e[5]
        })
      }
    }
    return res.send({
      status: 'success',
      pair,
      data: ohlcs,
      balances,
      positions,
      orders,
      timeframes,
      timeframe
    })
  }

  createOrderInputs = [
    body('type').notEmpty(),
    body('side').notEmpty(),
    body('price').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    body('amount').notEmpty()
  ]

  public async createOrder (req: express.Request, res: express.Response) {
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
    // get pair
    const pair = await models.pairs.findOne({
      where: {id: req.params.id},
      include: [{
        model: models.accounts,
        include: [{
          model: models.exchanges
        }]
      }]
    })
    // no pair
    if (pair === null) {
      return res.send({ status: 'error', message: 'No pair found' })
    }
    // not owner
    if (pair.userIdusers !== user.idusers) {
      return res.send({ status: 'error', message: 'Not owner' })
    }
    // init broker
    const broker = new ccxt[pair.account.exchange.exchange]({
      enableRateLimit: true,
      apiKey: pair.account.key,
      secret: pair.account.secret
    })
    if (pair.account.testnet === true) {
      broker.setSandboxMode(true)
    }
    // create order
    try {
      const ret = await broker.createOrder(pair.pair, req.body.type, req.body.side, req.body.amount, req.body.price)
      return res.send({ status: 'success', message: 'Order created!' })
    } catch (e) {
      return res.send({ status: 'error', message: e.message })
    }
  }

  init () {
    this.router.get('/', this.getPairsInputs, this.getPairs)
    this.router.get('/:id', this.getPairInputs, this.getPair)
    this.router.post('/:id', this.createOrderInputs, this.createOrder)
  }
}

const pairsRoutes = new PairsRouter()
pairsRoutes.init()

export default pairsRoutes.router
