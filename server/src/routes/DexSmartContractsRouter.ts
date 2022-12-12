import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'
import BigNumber from 'bignumber.js'
import { VM, VMScript } from 'vm2'

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
    // get smartcontract
    let dexsmartcontract = await models.dexsmartcontracts.findOne({
      where: {id: req.params.id},
      include: {
        model: models.dexsmartcontractsabis
      }
    })
    // no pair
    if (dexsmartcontract === null) {
      return res.send({ status: 'error', message: 'No smart contract found' })
    }
    dexsmartcontract = dexsmartcontract.toJSON()
    // get smartcontract views and accounts
    const wallets: any[] =[]
    const dexwallets = await models.dexwallets.findAll({
      where: {
        userIdusers: user.idusers
      }
    })
    const baseInject = new VMScript(`const base = ${dexsmartcontract.data}`, 'data.js').compile()
    const ethereumApi = new EthereumApi()
    for (const dexwallet of dexwallets) {
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const vm = new VM({
        sandbox: {
          web3Wallet,
          dexsmartcontract
        }
      })
      await vm.run(baseInject)
      const outData = await vm.run(`base.view.fn()`)
      wallets.push({
        id: dexwallet.id,
        name: dexwallet.name,
        data: outData
      })
    }
    const vm = new VM()
    await vm.run(baseInject)
    const data = await vm.run(`base`)
    // return data
    return res.send({
      status: 'success',
      dexsmartcontract: {...dexsmartcontract, data },
      wallets
    })
  }

  init () {
    this.router.get('/', this.getDexSmartContractsInputs, this.getDexSmartContracts)
    this.router.get('/:id', this.getDexSmartContractInputs, this.getDexSmartContract)
  }
}

const dexSmartContractsRoutes = new DexSmartContractsRouter()
dexSmartContractsRoutes.init()

export default dexSmartContractsRoutes.router
