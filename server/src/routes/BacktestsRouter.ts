import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { query, body, param, validationResult } from 'express-validator'
import { taskQueue } from '../taskqueue'
import { VMScript } from 'vm2'

export class BacktestsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getBacktestsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('offset').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('order').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async getBacktests (req: express.Request, res: express.Response) {
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
    const backtests = await models.backtestsessions.findAndCountAll({
        where,
        offset,
        limit,
        order
    })
    return res.send({ status: 'success', backtests: backtests.rows, entries: backtests.count })
  }

  getBacktestInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getBacktest (req: express.Request, res: express.Response) {
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
    // get backtest
    const backtest = await models.backtestsessions.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if (backtest === null) {
      return res.send({ status: 'error', message: 'No session found or no access' })
    }
    // ohlcs
    const ohlcs = await models.backtestohlcs.findAll({
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
        backtestsessionId: req.params.id
      },
      order: [['timestamp', 'ASC']] 
    })
    // logs
    const logs = await models.backtestlogs.findAll({
      where: {
        backtestsessionId: req.params.id
      },
      order: [['timestamp', 'DESC']] 
    })
    return res.send({ status: 'success', backtest, ohlcs, logs })
  }

  backtestInputs = [
    body('id').isLength({ min: 1, max: 50 }),
    body('name').isLength({ min: 1, max: 50 })
  ]

  public async backtest (req: express.Request, res: express.Response) {
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
      return res.send({ status: 'error', message: 'Compile error', error: err.message })
    }
    // create session
    const session = await models.backtestsessions.create({
      code: bot.code,
      name: req.body.name,
      userIdusers: user.idusers
    })
    // create task
    await taskQueue.addTask({type: 'BacktestSession', id: session.id})
    return res.send({ status: 'success', id: session.id })
  }

  deleteBacktestInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async deleteBacktest (req: express.Request, res: express.Response) {
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
    const backtestession = await models.backtestsessions.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (backtestession === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (backtestession.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    await models.backtestsessions.destroy({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // return
    return res.send({ status: 'success' })
  }

  restartBacktestInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async restartBacktest (req: express.Request, res: express.Response) {
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
    // get session
    const session = await models.backtestsessions.findOne({
      name: req.params.id,
      userIdusers: user.idusers
    })
    // not found
    if (session === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (session.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    // create task
    await taskQueue.addTask({type: 'BacktestSession', id: session.id})
    return res.send({ status: 'success', id: session.id })
  }

  stopBacktestInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async stopBacktest (req: express.Request, res: express.Response) {
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
    // get backtest
    const backtestssession = await models.backtestsessions.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    // not found
    if (backtestssession === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    await taskQueue.stopTask(backtestssession.id)
    return res.send({ status: 'success' })
  }

  init () {
    this.router.get('/', this.getBacktestsInputs, this.getBacktests)
    this.router.get('/:id', this.getBacktestInputs, this.getBacktest)
    this.router.post('/:id/stop', this.stopBacktestInputs, this.stopBacktest)
    this.router.post('/:id/restart', this.restartBacktestInputs, this.restartBacktest)
    this.router.delete('/:id/delete', this.deleteBacktestInputs, this.deleteBacktest)
    this.router.post('/', this.backtestInputs, this.backtest)
  }
}

const backtestsRouter = new BacktestsRouter()
backtestsRouter.init()

export default backtestsRouter.router
