import express from 'express'
import { ethers } from 'ethers'
import { getMeUser } from '../me'
import models from '../models'
import { body, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'
import { marketplaceABI } from '../ethereumApi'
import superagent from 'superagent'
import { config } from '../config/config'
import { VM } from 'vm2'

const marketplaceIFace = new ethers.utils.Interface(marketplaceABI);

export class MarketplaceRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  public async searchMarketplace (req: express.Request, res: express.Response) {
    try {
      const baseReq = await superagent
        .get(config.app.baseUri+req.originalUrl)
        .type('application/json')
      if (baseReq.body.status === 'success'){
        return res.send({ ...baseReq.body })
      } else {
        return res.send({ status: 'error', message: baseReq.body.message})
      }
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public getMarketplaceItemInputs = [
    param('id').isString().isLength({ min: 1, max: 50 }),
  ]

  public async getMarketplaceItem (req: express.Request, res: express.Response) {
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
    // get all accounts
    const dexwallets = await models.dexwallets.findAll({
      where: {
        userIdusers: user.idusers
      }
    })
    // create signatures
    const signatures = []
    for (const dexwallet of dexwallets) {
      const web3WalletSigner = await ethers.Wallet.fromMnemonic(dexwallet.seedphrase, "m/44'/60'/0'/0/" + dexwallet.walletindex)
      const message = `I am owner of ${dexwallet.address}`
      const signature = await web3WalletSigner.signMessage(message)
      signatures.push({
        message,
        signature
      })
    }
    // request
    try {
      const baseReq = await superagent
        .post(config.app.baseUri+'/api/v1/marketplace/'+req.params.id)
        .type('application/json')
        .send({
          signatures
        })
      if (baseReq.body.status === 'success'){
        return res.send({ ...baseReq.body })
      } else {
        return res.send({ status: 'error', message: baseReq.body.message})
      }
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public addMarketplaceItemInputs = [
    body('title').isString().isLength({ min: 1, max: 50 }),
    body('description').isString().isLength({ min: 1 }),
    body('type').isString().isLength({ min: 1 }),
    body('price').isString().isLength({ min: 1 }),
    body('wallet').isString().isLength({ min: 1 }),
    body('data').optional({ nullable: true, checkFalsy: true }).notEmpty(),
    body('botorsession').optional({ nullable: true, checkFalsy: true }).notEmpty()
  ]

  public async addMarketplaceItem (req: express.Request, res: express.Response) {
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
    // load wallet
    const dexwallet = await models.dexwallets.findOne({
      where: { id: req.body.wallet, userIdusers: user.idusers }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'Wallet not found' })
    }
    // type
    let data: any = {}
    let blockchainType = undefined
    if (req.body.type === 'Bot'){
      blockchainType = 0
      const bot = await models.bots.findOne({where:{id:req.body.botorsession}})
      if (bot === null) return res.send({ status: 'error', message: 'Bot not found' })
      data = {code: bot.code}
    }
    if (req.body.type === 'Script'){
      blockchainType = 0
      data = {code: req.body.data}
    }
    if (req.body.type === 'Subscription') {
      blockchainType = 1
      const session = await models.tradesessions.findOne({where:{id:req.body.botorsession}})
      if (session === null) return res.send({ status: 'error', message: 'Session not found' })
      const vm = new VM()
      vm.run(session.code)
      const loader = vm.run(`loader`)
      if (loader.exchanges && loader.exchanges.length > 0) {
        data['exchanges'] = []
        let indexExchanges = 0
        for(const item of loader.exchanges){
          const account = await models.accounts.findOne({where:{name:item.exchange, userIdusers: user.idusers},include:[{model: models.exchanges}]})
          data['exchanges'].push({index: indexExchanges, type: account.exchange.type, exchange: account.exchange.exchange})
          indexExchanges++
        }
      }
      if (loader.ethereum && loader.ethereum.length > 0) {
        data['ethereum'] = []
        let indexEthereum = 0
        for(const item of loader.ethereum){
          data['ethereum'].push({index: indexEthereum})
          indexEthereum++
        }
      }
    }
    if (blockchainType === undefined) {
      return res.send({ status: 'error', message: 'Unknown type'})
    }
    // execute
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.marketplace.addToMarketplace(blockchainType, req.body.price)
      const receipt = await tx.wait()
      const logData = marketplaceIFace.parseLog(receipt.logs[0])
      const { entryId } = logData.args
      const web3WalletSigner = await ethers.Wallet.fromMnemonic(dexwallet.seedphrase, "m/44'/60'/0'/0/" + dexwallet.walletindex)
      const message = `I am owner of ${dexwallet.address}`
      const signature = await web3WalletSigner.signMessage(message)
      const baseReq = await superagent
        .post(config.app.baseUri+'/api/v1/marketplace')
        .type('application/json')
        .send({
          title: req.body.title,
          description: req.body.description,
          type: req.body.type,
          blockchainType: blockchainType,
          price: req.body.price,
          owner: dexwallet.address,
          data: data,
          entryId: entryId.toString(),
          signature,
          message
        })
      if (baseReq.body.status === 'success'){
        if (req.body.type === 'Subscription') {
          await models.subtradesessions.create({
            remoteId: baseReq.body.marketplaceId,
            dexwalletId: dexwallet.id,
            tradesessionId: req.body.botorsession
          })
        }
        return res.send({ status: 'success', id: baseReq.body.marketplaceId })
      } else {
        return res.send({ status: 'error', message: baseReq.body.message})
      }
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public purchaseMarketplaceItemInputs = [
    param('id').isString().isLength({ min: 1, max: 50 }),
    body('price').isString().isLength({ min: 1 }),
    body('wallet').isString().isLength({ min: 1 }),
    body('blockchainId').isString().isLength({ min: 1 }),
  ]

  public async purchaseMarketplaceItem (req: express.Request, res: express.Response) {
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
    // load wallet
    const dexwallet = await models.dexwallets.findOne({
      where: { id: req.body.wallet, userIdusers: user.idusers }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'Wallet not found' })
    }
    // execute
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.marketplace.purchase(req.body.blockchainId,req.body.price)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash })
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public subscribeMarketplaceItemInputs = [
    param('id').isString().isLength({ min: 1, max: 50 }),
    body('price').isString().isLength({ min: 1 }),
    body('wallet').isString().isLength({ min: 1 }),
    body('blockchainId').isString().isLength({ min: 1 }),
  ]

  public async subscribeMarketplaceItem (req: express.Request, res: express.Response) {
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
    // load wallet
    const dexwallet = await models.dexwallets.findOne({
      where: { id: req.body.wallet, userIdusers: user.idusers }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'Wallet not found' })
    }
    // execute
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.marketplace.subscribe(req.body.blockchainId,req.body.price)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash })
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public unsubscribeMarketplaceItemInputs = [
    param('id').isString().isLength({ min: 1, max: 50 }),
    body('wallet').isString().isLength({ min: 1 }),
    body('blockchainId').isString().isLength({ min: 1 }),
  ]

  public async unsubscrbeMarketplaceItem (req: express.Request, res: express.Response) {
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
    // load wallet
    const dexwallet = await models.dexwallets.findOne({
      where: { id: req.body.wallet, userIdusers: user.idusers }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'Wallet not found' })
    }
    // execute
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.marketplace.unsubscribe(req.body.blockchainId)
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash })
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  public closeMarketplaceItemInputs = [
    param('id').isString().isLength({ min: 1, max: 50 }),
    body('wallet').isString().isLength({ min: 1 }),
    body('blockchainId').isString().isLength({ min: 1 }),
  ]

  public async closeMarketplaceItem (req: express.Request, res: express.Response) {
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
    // load wallet
    const dexwallet = await models.dexwallets.findOne({
      where: { id: req.body.walletm, userIdusers: user.idusers }
    })
    if (!dexwallet) {
      return res.send({ status: 'error', message: 'Wallet not found' })
    }
    // create signatures
    const web3WalletSigner = await ethers.Wallet.fromMnemonic(dexwallet.seedphrase, "m/44'/60'/0'/0/" + dexwallet.walletindex)
    const message = `I am owner of ${dexwallet.address}`
    const signature = await web3WalletSigner.signMessage(message)
    // execute
    try {
      const ethereumApi = new EthereumApi()
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      const tx = await web3Wallet.marketplace.close(req.body.blockchainId)
      // ping backend to update
      superagent
        .post(config.app.baseUri+'/api/v1/marketplace/'+req.params.id+'/close')
        .type('application/json')
        .send({
          signature
        })
      return res.send({ status: 'success', message: dexwallet.txviewer + tx.transactionHash })
    } catch (e) {
      console.log('error', e)
      return res.send({ status: 'error', message: e.message})
    }
  }

  init () {
    this.router.post('/', this.addMarketplaceItemInputs, this.addMarketplaceItem)
    this.router.get('/:id', this.getMarketplaceItemInputs, this.getMarketplaceItem)
    this.router.get('/', this.searchMarketplace)
    this.router.post('/:id/purchase', this.purchaseMarketplaceItemInputs, this.purchaseMarketplaceItem)
    this.router.post('/:id/subscribe', this.subscribeMarketplaceItemInputs, this.subscribeMarketplaceItem)
    this.router.post('/:id/unsubscribe', this.unsubscribeMarketplaceItemInputs, this.unsubscrbeMarketplaceItem)
    this.router.post('/:id/close', this.closeMarketplaceItemInputs, this.closeMarketplaceItem)
  }
}

const marketplaceRoutes = new MarketplaceRouter()
marketplaceRoutes.init()

export default marketplaceRoutes.router
