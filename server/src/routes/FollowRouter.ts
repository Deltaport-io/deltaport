import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { query, body, param, validationResult } from 'express-validator'
import { taskQueue } from '../taskqueue'

export class FollowRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getFollowingInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('offset').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('order').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async getFollowings (req: express.Request, res: express.Response) {
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
    const follows = await models.followtrading.findAndCountAll({
        where,
        offset,
        limit,
        order
    })
    return res.send({ status: 'success', follows: follows.rows, entries: follows.count })
  }

  getFollowInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getFollow (req: express.Request, res: express.Response) {
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
    // get follow
    const follow = await models.followtrading.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if (follow === null) {
      return res.send({ status: 'error', message: 'No session found or no access' })
    }
    return res.send({ status: 'success', follow })
  }

  stopFollowInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async stopFollow (req: express.Request, res: express.Response) {
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
    const follow = await models.followtrading.findOne({
        where: {
            id: req.params.id,
            userIdusers: user.idusers
        }
    })
    if(follow === null){
      return res.send({status: 'error', message: 'session not found'})
    }
    await taskQueue.stopTask(follow.id)
    return res.send({ status: 'success' })
  }

  restartFollowInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async restartFollow (req: express.Request, res: express.Response) {
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
    const follow = await models.followtrading.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (follow === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (follow.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    // start task
    const task = await taskQueue.addTask({type: 'FollowSession', id: follow.id})
    // return
    return res.send({ status: 'success' })
  }

  followInputs = [
    body('remoteId').isLength({ min: 1, max: 50 }),
    body('name').isLength({ min: 1, max: 50 }),
    body('wallet').isLength({ min: 1, max: 50 }),
    body('mapping').isObject()
  ]

  public async follow (req: express.Request, res: express.Response) {
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
    // validate wallet
    const wallet = await models.dexwallets.findOne({where: {id: req.body.wallet, userIdusers: user.idusers}})
    if (!wallet) {
      return res.send({ status: 'error', message: 'Not wallet owner' })
  }
    // create session
    const session = await models.followtrading.create({
      remoteId: req.body.remoteId,
      name: req.body.name,
      userIdusers: user.idusers,
      mapping: req.body.mapping,
      dexwalletId: wallet.id
    })
    // create task
    await taskQueue.addTask({type: 'FollowSession', id: session.id})
    return res.send({ status: 'success', id: session.id })
  }

  deleteFollowInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async deleteFollow (req: express.Request, res: express.Response) {
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
    const follow = await models.followtrading.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // not found
    if (follow === null){
      return res.send({ status: 'error', message: 'Not found' })
    }
    // not ended
    if (follow.ended === null) {
      return res.send({ status: 'error', message: 'Not ended' })
    }
    await models.followtrading.destroy({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    // return
    return res.send({ status: 'success' })
  }

  init () {
    this.router.get('/', this.getFollowingInputs, this.getFollowings)
    this.router.post('/:id/stop', this.stopFollowInputs, this.stopFollow)
    this.router.post('/:id/restart', this.restartFollowInputs, this.restartFollow)
    this.router.delete('/:id/delete', this.deleteFollowInputs, this.deleteFollow)
    this.router.get('/:id', this.getFollowInputs, this.getFollow)
    this.router.post('/', this.followInputs, this.follow)
  }
}

const followRouter = new FollowRouter()
followRouter.init()

export default followRouter.router