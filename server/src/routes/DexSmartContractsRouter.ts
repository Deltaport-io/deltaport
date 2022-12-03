import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { body, query, param, validationResult } from 'express-validator'
import { EthereumApi } from '../ethereumApi'
import BigNumber from 'bignumber.js'

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
    const dexsmartcontract = await models.dexsmartcontracts.findOne({
      where: {id: req.params.id},
      include: {
        model: models.dexsmartcontractsabis
      }
    })
    // no pair
    if (dexsmartcontract === null) {
      return res.send({ status: 'error', message: 'No smart contract found' })
    }
    // get smartcontract views and accounts
    const wallets: any[] =[]
    const dexwallets = await models.dexwallets.findAll({
      where: {
        userIdusers: user.idusers
      }
    })
    const ethereumApi = new EthereumApi()
    for (const dexwallet of dexwallets) {
      const web3Wallet = await ethereumApi.wallet(dexwallet)
      let data: any = {}
      /*
      const AaveData = {
        view: {
          ui: {
            
          },
          fn: async (wallet: any, smartcontractData: any) => {
            const tempData = await wallet.executeReadContractAction('0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', smartcontractData.dexsmartcontractabis, 'getUserAccountData', [wallet.address])
            return {
              totalCollateralETH: tempData.totalCollateralETH.toString(),
              totalDebtETH: tempData.totalDebtETH.toString(),
              availableBorrowsETH: tempData.availableBorrowsETH.toString(),
              currentLiquidationThreshold: tempData.currentLiquidationThreshold.toString(),
              ltv: tempData.ltv.toString()
            }
          }
        },
        actions: {
          swap: {
            ui: {
              // kra
            },
            fn: {
              // kra
            }
          }
        }
      }
      */
      const UniswapData = {
        view: {
          onload: {
            ui: {
              rows: [{
                name: 'BUSD',
                value: 'token0',
                type: 'balance',
                decimals: 18
              }, {
                name: 'WETH',
                value: 'token1',
                type: 'balance',
                decimals: 18
              }]
            },
            fn: async (wallet: any, smartcontractData: any) => {
              const promises = await Promise.all([
                wallet.token('0x4fabb145d64652a948d72533023f6e7a623c7c53').getBalance(wallet.address),
                wallet.token('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').getBalance(wallet.address)
              ])
              return {
                token0: promises[0].toString(),
                token1: promises[1].toString()
              }
            }
          }
        },
        actions: {
          swap: {
            title: 'Swap',
            ui: {
              inputs: [{
                name: 'Wallet',
                id: 'walletSelect',
                type: 'walletSelect'
              },{
                name: 'Direction',
                id: 'swapDirection',
                type: 'select',
                options: [{
                  title: 'BUSD to WETH',
                  value: '1'
                },{
                  title: 'WETH to BUSD',
                  value: '-1'
                }]
              },{
                name: 'Amount in',
                conditions: {
                  swapDirection: 1
                },
                id: 'amontIn',
                type: 'balanceInput',
                decimals: 18
              },{
                name: 'Amount in',
                conditions: {
                  swapDirection: -1
                },
                id: 'amontIn',
                type: 'balanceInput',
                decimals: 18
              }]
            },
            fn: async (wallet: any, smartcontractData: any, inputs: any) => {
              const allowance = await wallet.readContractAction('0xE592427A0AEce92De3Edee1F18E0157C05861564', smartcontractData.dexsmartcontractabis, 'allowance', [wallet.address])
              if (allowance.lt(inputs.inputAmount)){
                const uint256max = new BigNumber(2).pow(256).minus(1)
                await wallet.executeReadContractAction(inputs.direction ? '0x4fabb145d64652a948d72533023f6e7a623c7c53' : '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', smartcontractData.dexsmartcontractabis, 'approve', ['0xE592427A0AEce92De3Edee1F18E0157C05861564', uint256max])
              }
              const args = [
                inputs.direction ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' : '0x4fabb145d64652a948d72533023f6e7a623c7c53',
                inputs.direction ? '0x4fabb145d64652a948d72533023f6e7a623c7c53' : '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                3,
                wallet.address,
                new Date().getTime(),
                inputs.inputsAmount,
                0,
                0
              ]
              return wallet.executeContractAction('0xE592427A0AEce92De3Edee1F18E0157C05861564', smartcontractData.dexsmartcontractabis, 'exactInputSingle', args)
            }
          }
        }
      }
      if (UniswapData && UniswapData.view && UniswapData.view.onload) {
        data = await UniswapData.view.onload.fn(web3Wallet, dexsmartcontract)
      }
      wallets.push({
        id: dexwallet.id,
        name: dexwallet.name,
        data
      })
    }
    // return data
    return res.send({
      status: 'success',
      dexsmartcontract: dexsmartcontract,
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
