import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'

export class DexSmartContractsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getDexSmartContractsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    query('limit').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 10 }),
    query('offset').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 })
  ]

  public async getDexSmartContracts (req: express.Request, res: express.Response) {
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
      where = models.Sequelize.literal(`MATCH (keywords) AGAINST("${req.query.search}")`)
      const dexsmartcontracts = await models.dexsmartcontracts.findAndCountAll({
        offset,
        limit,
        where,
        include: [{
          model: models.dextokens
        }]
      })
      return res.send({ status: 'success', dexsmartcontracts: dexsmartcontracts.rows, entries: dexsmartcontracts.count })
    }
    // get default
    const dexsmartcontracts = await models.dexsmartcontracts.findAndCountAll({
        offset,
        limit,
        include: [{
          model: models.dextokens
        }]
    })
    return res.send({ status: 'success', dexsmartcontracts: dexsmartcontracts.rows, entries: dexsmartcontracts.count })
  }

  /*
  getDexSmartContractInputs = [
    param('id').isLength({ min: 1, max: 128 })
  ]

  public async getDexSmartContract (req: express.Request, res: express.Response) {
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
  */

  init () {
    this.router.get('/', this.getDexSmartContractsInputs, this.getDexSmartContracts)
    // this.router.get('/:id', this.getDexSmartContractInputs, this.getDexSmartContract)
  }
}

const dexSmartContractsRoutes = new DexSmartContractsRouter()
dexSmartContractsRoutes.init()

export default dexSmartContractsRoutes.router
