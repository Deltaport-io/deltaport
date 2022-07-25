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
    if (req.query.search || req.query.include) {
      if (req.query.search) {
        where = {
          symbol: {
            [models.Sequelize.Op.like]: `%${req.query.search}%`
          }
        }
      }
      if (req.query.include) {
        const includeArray = req.query.include.toString().split('-')
        where = {
          symbol: includeArray,
        }
      }
      const tokens = await models.dextokens.findAndCountAll({
        attributes: ['id'],
        where,
        include: [{
          model: models.dexpools,
          attributes: ['id']
        }]
      })
      // loop over tokens and collect pools
      const poolList: any[] = []
      for (const token of tokens.rows) {
        for (const pool of token.dexpools) {
          poolList.push(pool.id)
        }
      }
      const dexpools = await models.dexpools.findAndCountAll({
        offset,
        limit,
        where: {
          id: poolList
        },
        include: [{
          model: models.dextokens
        },{
          model: models.dexes
        }]
      })
      return res.send({ status: 'success', dexpools: dexpools.rows, entries: dexpools.count })
    }
    // get default
    const dexpools = await models.dexpools.findAndCountAll({
        offset,
        limit,
        include: [{
          model: models.dextokens,
        },{
          model: models.dexes
        }]
    })
    return res.send({ status: 'success', dexpools: dexpools.rows, entries: dexpools.count })
  }

  getDexPoolInputs = [
    param('id').isLength({ min: 1, max: 128 })
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
        model: models.dextokens
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
      const balances = {}
      let aave: any = undefined
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      for (const dextoken of dexpool.dextokens) {
        const token = web3Wallet.token(dextoken.id)
        const balance = (await token.getBalance()).toString()
        balances[dextoken.symbol] = balance
      }
      if (dexpool.dex.name === 'Aave') {
        const pool = web3Wallet.pool(dexpool.id)
        const tempdata = await pool.lendPoolGetUserAccountData(dexwallet.address)
        aave = {
          totalCollateralETH: tempdata.totalCollateralETH.toString(),
          totalDebtETH: tempdata.totalDebtETH.toString(),
          availableBorrowsETH: tempdata.availableBorrowsETH.toString(),
          currentLiquidationThreshold: tempdata.currentLiquidationThreshold.toString(),
          ltv: tempdata.ltv.toString()
        }
      }
      wallets.push({
        id: dexwallet.id,
        name: dexwallet.name,
        balances,
        aave
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
      const amount = (await pool.swapQuote(req.body.direction, req.body.amount)).toString()
      return res.send({ status: 'success', amount: amount})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  public lendDepositDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
  ]

  public async lendDepositDexPool (req: express.Request, res: express.Response) {
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
      // deposit
      const tx = await pool.lendDeposit(req.body.amount)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  public lendBorrowDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('interestMode').isString().notEmpty()
  ]

  public async lendBorrowDexPool (req: express.Request, res: express.Response) {
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
      // borrow
      const tx = await pool.lendBorrow(req.body.amount, req.body.interestMode)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  public lendWithdrawDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty()
  ]

  public async lendWithdrawDexPool (req: express.Request, res: express.Response) {
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
      // withdraw
      const tx = await pool.lendWithdraw(req.body.amount)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  public lendRepayDexPoolInputs = [
    param('id').isString().notEmpty(),
    body('wallet').isString().notEmpty(),
    body('amount').isString().notEmpty(),
    body('interestMode').isString().notEmpty()
  ]

  public async lendRepayDexPool (req: express.Request, res: express.Response) {
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
      // repay
      const tx = await pool.lendRepay(req.body.amount, req.body.interestMode)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      return res.send({ status: 'error', message: e.message})
    }
  }

  init () {
    this.router.get('/', this.getDexPoolsInputs, this.getDexPools)
    this.router.get('/:id', this.getDexPoolInputs, this.getDexPool)
    this.router.post('/:id/swap', this.swapDexPoolInputs, this.swapDexPool)
    this.router.post('/:id/swapquote', this.swapQuoteDexPoolInputs, this.swapQuoteDexPool)
    this.router.post('/:id/lenddeposit', this.lendDepositDexPoolInputs, this.lendDepositDexPool)
    this.router.post('/:id/lendborrow', this.lendBorrowDexPoolInputs, this.lendBorrowDexPool)
    this.router.post('/:id/lendwithdraw', this.lendWithdrawDexPoolInputs, this.lendWithdrawDexPool)
    this.router.post('/:id/lendrepay', this.lendRepayDexPoolInputs, this.lendRepayDexPool)
  }
}

const dexPoolsRoutes = new DexPoolsRouter()
dexPoolsRoutes.init()

export default dexPoolsRoutes.router
