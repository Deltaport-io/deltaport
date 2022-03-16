import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'

export class DexPoolsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getDexPoolsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 10 }),
    query('offset').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 })
  ]

  public async getDexPools (req: express.Request, res: express.Response) {
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
      // concat to match 2 tokens in any order
      where = models.Sequelize.literal(`CONCAT(token0.symbol, ' ',token1.symbol, ' ', token0.symbol) LIKE "%${req.query.search.toString().toUpperCase()}%"`)
    }
    if (req.query.include) {
      const includeArray = req.query.include.toString().split('-')
      where = {
        [models.Sequelize.Op.or]: {
          "$token0.symbol$": includeArray,
          "$token1.symbol$": includeArray
        }
      }
    }
    // get my pools
    const dexpools = await models.dexpools.findAndCountAll({
        offset,
        limit,
        where,
        include: [{
          model: models.dextokens,
          as: 'token0',
          required: false
        },
        {
          model: models.dextokens,
          as: 'token1',
          required: false
        },{
          model: models.dexes
        }],
        order: [['txcount', 'desc']]
    })
    return res.send({ status: 'success', dexpools: dexpools.rows, entries: dexpools.count })
  }

  getDexPoolInputs = [
    param('id').isLength({ min: 1, max: 50 })
  ]

  public async getDexPool (req: express.Request, res: express.Response) {
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
    const dexpool = await models.dexpools.findOne({
      where: {id: req.params.id},
      include: [{
        model: models.dextokens,
        as: 'token0',
      },
      {
        model: models.dextokens,
        as: 'token1',
      },{
        model: models.dexes
      }],
    })
    // no pair
    if (dexpool === null) {
      return res.send({ status: 'error', message: 'No pool found' })
    }
    // get pool balances and account
    const wallets: any[] =[]
    const dexwallets = await models.dexwallets.findAll({
      where: {
        userIdusers: user.idusers
      }
    })
    const ethereumApi = new EthereumApi()
    for (const dexwallet of dexwallets) {
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const token0 = await web3Wallet.token(dexpool.token0.id)
      const balance0 = (await token0.getBalance()).toString()
      const token1 = await web3Wallet.token(dexpool.token1.id)
      const balance1 = (await token1.getBalance()).toString()
      wallets.push({
        id: dexwallet.id,
        name: dexwallet.name,
        [dexpool.token0.symbol]: balance0,
        [dexpool.token1.symbol]: balance1
      })
    }
    // return data
    return res.send({
      status: 'success',
      dexpool: dexpool,
      wallets
    })
  }

  swapDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('direction').isBoolean().notEmpty()
  ]

  public async swapDexPool (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // get poll
    const dexpool = await models.dexpools.findOne({
      where: {id: req.params.id}
    })
    // no poll
    if (dexpool === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // account
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.body.wallet,
        userIdusers: user.idusers
      }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'No dex account found' })
    }
    // load pool
    const ethereumApi = new EthereumApi()
    const web3Account = await ethereumApi.wallet(dexwallet)
    const pool = await web3Account.pool(dexpool.id)
    try {
      // swap
      const tx = await pool.swap(dexwallet.address, req.body.direction, req.body.amount)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  swapQuoteDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('direction').isBoolean().notEmpty()
  ]

  public async swapQuoteDexPool (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // get poll
    const dexpool = await models.dexpools.findOne({
      where: {id: req.params.id}
    })
    // no poll
    if (dexpool === null) {
      return res.send({ status: 'error', message: 'No token found' })
    }
    // account
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.body.wallet,
        userIdusers: user.idusers
      }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'No dex account found' })
    }
    // load pool
    const ethereumApi = new EthereumApi()
    const web3Account = await ethereumApi.wallet(dexwallet)
    const pool = await web3Account.pool(dexpool.id)
    try {
      // quote
      const amount = (await pool.getQuote(req.body.direction, req.body.amount)).toString()
      return res.send({ status: 'success', amount: amount})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  init () {
    this.router.get('/', this.getDexPoolsInputs, this.getDexPools)
    this.router.get('/:id', this.getDexPoolInputs, this.getDexPool)
    this.router.post('/:id/swap', this.swapDexPoolInputs, this.swapDexPool)
    this.router.post('/:id/swapquote', this.swapQuoteDexPoolInputs, this.swapQuoteDexPool)
  }
}

const dexPoolsRoutes = new DexPoolsRouter()
dexPoolsRoutes.init()

export default dexPoolsRoutes.router
