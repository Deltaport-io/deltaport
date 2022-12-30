import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'
import BigNumber from 'bignumber.js'
import { VM, VMScript } from 'vm2'
import { input } from '@tensorflow/tfjs'

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
    const dexwallets = await models.dexwallets.findAll({
      where: {userIdusers: user.idusers}
    })
    const ethereumApi = new EthereumApi()
    const web3Wallets: any = {}
    for (const dexwallet of dexwallets) {
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      web3Wallets[dexwallet.id] = web3Wallet
    }
    const vm = new VM({
      sandbox: {
        web3Wallets,
        dexsmartcontract
      }
    })
    const baseInject = new VMScript(`const base = ${dexsmartcontract.data}`, 'data.js').compile()
    await vm.run(baseInject)
    const wallets: any[] = []
    for (const dexwallet of dexwallets) {
      const outData = await vm.run(`base.view.fn("${dexwallet.id}")`)
      wallets.push({
        id: dexwallet.id,
        name: dexwallet.name,
        data: outData
      })
    }
    const base = await vm.run(`base`)
    return res.send({
      status: 'success',
      dexsmartcontract: {...dexsmartcontract, data: base},
      wallets
    })
  }

  executeDexSmartContractInputs = [
    param('id').isLength({ min: 1, max: 128 }),
    param('action').isLength({ min: 1, max: 128 }),
    body('input').isObject()
  ]

  public async executeDexSmartContract (req: express.Request, res: express.Response) {
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
    // no smart contract
    if (dexsmartcontract === null) {
      return res.send({ status: 'error', message: 'No smart contract found' })
    }
    dexsmartcontract = dexsmartcontract.toJSON()
    const dexwallets = await models.dexwallets.findAll({
      where: { userIdusers: user.idusers }
    })
    const ethereumApi = new EthereumApi()
    const web3Wallets: any = {}
    for (const dexwallet of dexwallets) {
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      web3Wallets[dexwallet.id] = web3Wallet
    }
    const vm = new VM({
      sandbox: {
        web3Wallets,
        dexsmartcontract,
        inputs: req.body.input
      }
    })
    const baseInject = new VMScript(`const base = ${dexsmartcontract.data}`, 'data.js').compile()
    await vm.run(baseInject)
    const outData = await vm.run(`base.view.actions["${req.params.action}"].fn()`)
    return res.send({
      status: 'success',
      data: outData
    })
  }

  init () {
    this.router.get('/', this.getDexSmartContractsInputs, this.getDexSmartContracts)
    this.router.get('/:id', this.getDexSmartContractInputs, this.getDexSmartContract)
    this.router.post('/:id/execute/:action', this.executeDexSmartContractInputs, this.executeDexSmartContract)
  }
}

const dexSmartContractsRoutes = new DexSmartContractsRouter()
dexSmartContractsRoutes.init()

export default dexSmartContractsRoutes.router
