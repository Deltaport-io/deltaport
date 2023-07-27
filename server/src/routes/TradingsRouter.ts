import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { query, body, param, validationResult } from 'express-validator'
import { taskQueue } from '../taskqueue'
import { VMScript } from 'vm2'

export class TradingsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getTradingsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('offset').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('order').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async getTradings (req: express.Request, res: express.Response) {
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
    let limit = 9999
    if (req.query.limit) {
      limit = parseInt(req.query.limit as any)
    }
    let offset = 0
    if (req.query.offset) {
      offset = parseInt(req.query.offset as any)
    }
    const order = []
    if (req.query.order) {
      if (req.query.order === 'createdoldest') {
        order.push(['createdAt'])
      }
      if (req.query.order === 'creatednewest') {
        order.push(['createdAt', 'DESC'])
      }
    }
    let where: any = {
      userIdusers: user.idusers
    }
    const tradings = await models.tradesessions.findAndCountAll({
        where,
        offset,
        limit,
        order
    })
    return res.send({ status: 'success', tradings: tradings.rows, entries: tradings.count })
  }

  getTradingInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getTrading (req: express.Request, res: express.Response) {
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
    // get trading
    const tradesession = await models.tradesessions.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if (tradesession === null) {
      return res.send({ status: 'error', message: 'No session found or no access' })
    }
    // ohlcs
    const ohlcs = await models.tradeohlcs.findAll({
      attributes: [
        'source',
        [models.sequelize.literal('UNIX_TIMESTAMP(timestamp)*1000'), 'timestamp'],
        'open',
        'high',
        'low',
        'close',
        'volume'
      ],
      where: {
        tradesessionId: req.params.id
      },
      order: [['timestamp', 'ASC']] 
    })
    // graphs
    const graphs = await models.tradegraphs.findAll({
      attributes: [
        'graph',
        [models.sequelize.literal('UNIX_TIMESTAMP(timestamp)*1000'), 'timestamp'],
        'key',
        'value'
      ],
      where: {
        tradesessionId: req.params.id
      },
      order: [['timestamp', 'ASC']]
    })
    // logs
    const logs = await models.tradelogs.findAll({
      where: {
        tradesessionId: req.params.id
      },
      order: [['timestamp', 'DESC']] 
    })
    return res.send({ status: 'success', tradesession, ohlcs, logs, graphs })
  }

  stopTradingInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async stopTrading (req: express.Request, res: express.Response) {
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
    // get trading
    const tradesession = await models.tradesessions.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if(tradesession === null){
      return res.send({status: 'error', message: 'session not found'})
    }
    await taskQueue.stopTask(tradesession.id)
    return res.send({ status: 'success' })
  }

  restartTradingInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async restartTrading (req: express.Request, res: express.Response) {
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
    // get trading
    const tradesession = await models.tradesessions.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (tradesession === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (tradesession.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    // start task
    try {
      await taskQueue.addTask({type: 'TradeSession', id: tradesession.id})
      return res.send({ status: 'success' })
    } catch(e) {
      return res.send({ status: 'error' })
    }
  }

  tradeInputs = [
    body('id').isLength({ min: 1, max: 50 }),
    body('name').isLength({ min: 1, max: 50 })
  ]

  public async trade (req: express.Request, res: express.Response) {
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
    // load bot
    const bot = await models.bots.findOne({
      where: {
        id: req.body.id,
        userIdusers: user.idusers
      }
    })
    if (bot === null) {
      return res.send({ status: 'error', message: 'Not bot or access' })
    }
    // check code
    try {
      new VMScript(bot.code, 'bot.js').compile();
    } catch (err) {
      return res.send({ status: 'error', message: 'Compile error', error: err })
    }
    // create session
    const session = await models.tradesessions.create({
      code: bot.code,
      name: req.body.name,
      userIdusers: user.idusers
    })
    // create task
    await taskQueue.addTask({type: 'TradeSession', id: session.id})
    return res.send({ status: 'success', id: session.id })
  }

  deleteTradingInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async deleteTrading (req: express.Request, res: express.Response) {
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
    // get trading
    const tradesession = await models.tradesessions.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (tradesession === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (tradesession.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    await models.tradesessions.destroy({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // return
    return res.send({ status: 'success' })
  }

  init () {
    this.router.get('/', this.getTradingsInputs, this.getTradings)
    this.router.post('/:id/stop', this.stopTradingInputs, this.stopTrading)
    this.router.post('/:id/restart', this.restartTradingInputs, this.restartTrading)
    this.router.delete('/:id/delete', this.deleteTradingInputs, this.deleteTrading)
    this.router.get('/:id', this.getTradingInputs, this.getTrading)
    this.router.post('/', this.tradeInputs, this.trade)
  }
}

const tradingsRouter = new TradingsRouter()
tradingsRouter.init()

export default tradingsRouter.router