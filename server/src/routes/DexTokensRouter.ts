import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'

export class DexTokensRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getDexTokensInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('include').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 50 }),
    query('offset').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }),
  ]

  public async getDexTokens (req: express.Request, res: express.Response) {
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
    let limit = 50
    if (req.query.limit) {
      limit = parseInt(req.query.limit as any)
    }
    let offset = 0
    if (req.query.offset) {
      offset = parseInt(req.query.offset as any)
    }
    let where:any = {}
    if (req.query.search) {
      where = models.Sequelize.literal(`dextokens.symbol LIKE "%${req.query.search.toString().toUpperCase()}%" OR dextokens.name LIKE "%${req.query.search.toString().toUpperCase()}%"`)
    }
    if (req.query.include) {
      const includeArray = req.query.include.toString().split('-')
      where = {
        symbol: includeArray
      }
    }
    // get tokens
    const tokens = await models.dextokens.findAndCountAll({
        where,
        include: {
          model: models.dexchains
        },
        offset,
        limit,
        order: [['symbol']]
    })
    return res.send({ status: 'success', tokens: tokens.rows, entries: tokens.count })
  }

  getDexTokenInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getDexToken (req: express.Request, res: express.Response) {
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
    // get token
    const dextoken = await models.dextokens.findOne({
      where: {id: req.params.id},
    })
    // no token
    if (dextoken === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // get & loop accounts
    const wallets = await models.dexwallets.findAll({
      where: {
        userIdusers: user.idusers,
        dexchainId: dextoken.dexchainId
      },
      include: {
        model: models.dexchains
      }
    })
    const balances: any[] = []
    const ethereumApi = new EthereumApi()
    for (const wallet of wallets) {
      const web3Account = await ethereumApi.wallet(wallet)
      const token = await web3Account.token(dextoken.id)
      const balance = (await token.getBalance()).toString()
      balances.push({
        id: wallet.id,
        name: wallet.name,
        balance: balance
      })
    }
    return res.send({
      status: 'success',
      dextoken: dextoken,
      balances: balances
    })
  }

  createDexTokenTransferInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('address').isString().notEmpty()
  ]

  public async createDexTokenTransfer (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // get token
    const dextoken = await models.dextokens.findOne({
      where: {id: req.params.id}
    })
    // no token
    if (dextoken === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // account
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.body.wallet,
        userIdusers: user.idusers
      },
      include: {
        model: models.dexchains
      }
    })
    if (dexwallet === null) {
      return res.send({ status: 'error', message: 'No dex account found' })
    }
    // load token
    const ethereumApi = new EthereumApi()
    const web3Account = await ethereumApi.wallet(dexwallet)
    const token = await web3Account.token(dextoken.id)
    try {
      const tx = await token.transfer(req.body.address, req.body.amount)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  trackDexTokenInputs = [
  ]

  public async trackDexToken (req: express.Request, res: express.Response) {
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
    // get token
    const dextoken = await models.dextokens.findOne({
      where: {id: req.params.id}
    })
    // no token
    if (dextoken === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // create mapping
    try {
      await models.usersdextokens.create({
        dextokenId: req.params.id,
        userIdusers: user.idusers
      })
      return res.send({ status: 'success' })
    } catch (e) {
      return res.send({ status: 'error' })
    }
  }

  untrackDexTokenInputs = [
  ]

  public async untrackDexToken (req: express.Request, res: express.Response) {
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
    // get token
    const dextoken = await models.dextokens.findOne({
      where: {id: req.params.id}
    })
    // no token
    if (dextoken === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // remove mapping
    try {
      await models.usersdextokens.destroy({
        where: {
          dextokenId: req.params.id,
          userIdusers: user.idusers
        }
      })
      return res.send({ status: 'success' })
    } catch (e) {
      return res.send({ status: 'error' })
    }
  }

  init () {
    this.router.get('/', this.getDexTokensInputs, this.getDexTokens)
    this.router.get('/:id', this.getDexTokenInputs, this.getDexToken)
    this.router.post('/:id/transfer', this.createDexTokenTransferInputs, this.createDexTokenTransfer)
    this.router.post('/:id/track', this.trackDexTokenInputs, this.trackDexToken)
    this.router.post('/:id/untrack', this.untrackDexTokenInputs, this.untrackDexToken)
  }
}

const dextokensRoutes = new DexTokensRouter()
dextokensRoutes.init()

export default dextokensRoutes.router
