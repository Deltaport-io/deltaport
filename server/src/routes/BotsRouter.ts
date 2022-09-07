import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'

export class BotsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getBotsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 10 }),
    query('offset').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 })
  ]

  public async getBots (req: express.Request, res: express.Response) {
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
    let where:any = {}
    if (req.query.search) {
        where = {
            userIdusers: user.idusers,
            [models.Sequelize.Op.or]: [
              {
                name: {
                  [models.Sequelize.Op.like]: `%${req.query.search}%`
                }
              }
            ]
        }
    }
    const bots = await models.bots.findAndCountAll({
        where,
        offset,
        limit,
        order
    })
    return res.send({ status: 'success', bots: bots.rows, entries: bots.count })
  }

  getBotInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getBot (req: express.Request, res: express.Response) {
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
    // get bot
    const bot = await models.bots.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    return res.send({ status: 'success', bot })
  }

  newBotInputs = [
    body('name').isString().isLength({ min: 1, max: 50 }),
    body('code').isString()
  ]

  public async newBot (req: express.Request, res: express.Response) {
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
    // create bot
    const bot = await models.bots.create({
        code: req.body.code,
        name: req.body.name,
        userIdusers: user.idusers
    })
    return res.send({ status: 'success', id: bot.id })
  }

  updateBotInputs = [
    param('id').isLength({ min: 1, max: 50 }),
    body('name').isLength({ min: 1, max: 50 }),
    body('code').isString()
  ]

  public async updateBot (req: express.Request, res: express.Response) {
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
    // get bot
    const bot = await models.bots.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if(bot === null){
        return res.send({ status: 'error', message: 'No bot or access' })
    }
    await models.bots.update({
        code: req.body.code,
        description: req.body.description,
        name: req.body.name
    }, {
        where: {
          id: req.params.id
        }
    })
    return res.send({ status: 'success' })
  }

  deleteBotInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async deleteBot (req: express.Request, res: express.Response) {
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
    // get bot
    const bot = await models.bots.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (bot === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // remove
    await models.bots.destroy({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // return
    return res.send({ status: 'success' })
  }

  init () {
    this.router.get('/', this.getBotsInputs, this.getBots)
    this.router.get('/:id', this.getBotsInputs, this.getBot)
    this.router.post('/',this.newBotInputs, this.newBot)
    this.router.post('/:id',this.updateBotInputs, this.updateBot)
    this.router.delete('/:id',this.deleteBotInputs, this.deleteBot)
  }
}

const botsRouter = new BotsRouter()
botsRouter.init()

export default botsRouter.router
