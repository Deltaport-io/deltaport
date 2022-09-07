import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { query, param, body, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'
import { ethers } from 'ethers'

export class DexWalletsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getDexWalletsInputs = [
    query('search').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async getDexWallets (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Input validation failed.', errors: result.mapped() })
    }
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
    let where:any = {}
    if (req.query.search) {
      where = {
        name: {
          [models.Sequelize.Op.like]: `%${req.query.search}%`
        }
      }
    }
    const dexwallets = await models.dexwallets.findAndCountAll({
      attributes: ['id', 'name', 'nodeurl', 'walletindex', 'address'],
      where,
      offset,
      limit,
      order: [
        ['name']
      ]
    })
    return res.send({ status: 'success', dexwallets: dexwallets.rows, entries: dexwallets.count })
  }

  newDexWalletInputs = [
    body('name').isAlphanumeric().notEmpty(),
    body('nodeurl').isString().notEmpty(),
    body('seedphrase').isString().notEmpty(),
    body('walletindex').isNumeric().notEmpty(),
    body('txviewer').isString().notEmpty()
  ]

  public async newDexWallet (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
      return res.send({ status: 'error', message: 'No user' })
    }
    // test wallet and get address
    let address = ""
    try {
      const web3Wallet = await ethers.Wallet.fromMnemonic(req.body.seedphrase, "m/44'/60'/0'/0/" + req.body.walletindex)
      address = web3Wallet.address
      const provider = new ethers.providers.JsonRpcProvider(req.body.nodeurl)
      const { chainId } = await provider.getNetwork()
      // TODO: add back
      // if (chainId !== 1) {
      //   return res.send({ status: 'error', message: 'Not ethereum node' })
      // }
    } catch (e) {
      return res.send({ status: 'error', message: 'Something went wrong' })
    }
    // create wallet
    await models.dexwallets.create({
      name: req.body.name,
      seedphrase: req.body.seedphrase,
      nodeurl: req.body.nodeurl,
      walletindex: req.body.walletindex,
      txviewer: req.body.txviewer,
      address,
      userIdusers: user.idusers
    })
    return res.send({ status: 'success' })
  }

  deleteDexWalletInputs = [
    param('id').isString().notEmpty()
  ]

  public async deleteDexWallet (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // wallet
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'No wallet found' })
    }
    // delete wallet
    await models.dexwallets.destroy({
      where: {
        id: dexwallet.id,
        userIdusers: user.idusers
      }
    })
    return res.send({ status: 'success' })
  }

  getDexWalletInfoInputs = [
    param('id').isString().notEmpty()
  ]

  public async getDexWalletInfo (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // wallet
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'No wallet found' })
    }
    let balance = 'error'
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      balance = (await web3Wallet.getBalance()).toString()
    } catch (e) {
      // console.log('error', e)
    }
    const returnDexWallet = dexwallet
    returnDexWallet.seedphrase = ''
    return res.send({ status: 'success', balance: balance, dexwallet: returnDexWallet})
  }

  createDexWalletTransferInputs = [
    param('id').isString().notEmpty(),
    body('address').isString().notEmpty(),
    body('amount').isString().notEmpty()
  ]

  public async createDexWalletTransfer (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        return res.send({ status: 'error', message: 'Please fill all information.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
        return res.send({ status: 'error', message: 'No user' })
    }
    // wallet
    const dexwallet = await models.dexwallets.findOne({
      where: {
        id: req.params.id,
        userIdusers: user.idusers
      }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'No account found' })
    }
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.web3.eth.sendTransaction({to:req.body.address, from:dexwallet.address, value:req.body.amount})
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash})
    } catch (e) {
      // console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  init () {
    this.router.get('/', this.getDexWalletsInputs, this.getDexWallets)
    this.router.post('/',this.newDexWalletInputs, this.newDexWallet)
    this.router.delete('/:id',this.deleteDexWalletInputs, this.deleteDexWallet)
    this.router.get('/:id', this.getDexWalletInfoInputs, this.getDexWalletInfo)
    this.router.post('/:id/transfer', this.createDexWalletTransferInputs, this.createDexWalletTransfer)
  }
}

const dexwalletsRouter = new DexWalletsRouter()
dexwalletsRouter.init()

export default dexwalletsRouter.router