import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import models from './models'
import { config } from '././config/config'
import superagent from 'superagent'

export class EthereumApi {

  wallets: any = {}

  wallet = async (wallet: any, injectedAbis: any[] = [], trackingOptions=undefined) =>  {
    if (this.wallets[wallet.name]) {
      return this.wallets[wallet.name]
    }
    const web3Wallet = await ethers.Wallet.fromMnemonic(wallet.seedphrase, "m/44'/60'/0'/0/" + wallet.walletindex)
    const walletAddress = web3Wallet.address
    // prepare injected
    const injectedABIs = {}
    if (injectedAbis.length > 0) {
      for (const injectedAbi of injectedAbis) {
        injectedABIs[injectedAbi.name] = (contractAddress: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const injectedContract = new ethers.Contract(contractAddress, injectedAbi.abi, web3Provider)
          const returnObj = {}
          for (const abiEntry of injectedAbi.abi) {
            returnObj[abiEntry.name] = async (...args: any[]) => {
              this.trackActions(trackingOptions, {abi: abiEntry, address: contractAddress, args})
              return injectedContract[abiEntry.name](...args)
            }
          }
          return returnObj
        }
      }
    }
    // create wallet obj
    this.wallets[wallet.name] = {
      getBalance: async (address: string = undefined) => {
        const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
        return provider.getBalance(address ? address : walletAddress)
      },
      transferEther: async (toAddress: string, amount: number) => {
        const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
        const web3Provider = web3Wallet.connect(provider)
        this.trackActions(trackingOptions, {action: 'transferEther', from: walletAddress, to: toAddress, value: amount})
        return web3Provider.sendTransaction({from: walletAddress, to: toAddress, value: amount})
      },
      token: (tokenAddress: string) => {
        const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
        const web3Provider = web3Wallet.connect(provider)
        const contract = new ethers.Contract(tokenAddress, erc20ABI, web3Provider)
        const readContract = new ethers.Contract(tokenAddress, erc20ABI, provider)
        return {
          getBalance: async (address: string = undefined) => {
            return readContract.balanceOf(address ? address : walletAddress)
          },
          transfer: async (address: string, amount: string) => {
            await this.trackActions(trackingOptions, {abi: erc20ABI.find(e => e.name === 'transfer'), address: tokenAddress, args: [address, amount]})
            return contract.transfer(address, amount)
          },
          allowance: async (delegate: string) => {
            return readContract.allowance(walletAddress, delegate)
          },
          approve: async (delegate: string, amount: string) => {
            await this.trackActions(trackingOptions, {abi: erc20ABI.find(e => e.name === 'approve'), address: tokenAddress, args: [delegate, amount]})
            return contract.approve(delegate, amount)
          }
        }
      },
      pool: (poolAddress: string) => {
        const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
        const web3Provider = web3Wallet.connect(provider)
        const quoterContract = new ethers.Contract('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', uniswapQuoterABI, web3Provider)
        const readQuoterContract = new ethers.Contract('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', uniswapQuoterABI, provider)
        const routerContract = new ethers.Contract('0xE592427A0AEce92De3Edee1F18E0157C05861564', uniswapRouterABI, web3Provider)
        const aaveContract = new ethers.Contract('0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', aaveLendPoolABI, web3Provider)
        return {
          swap: async (toAddress: string, direction: boolean, amount: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Uniswap') {
              throw new Error('Pool does not support swap function')
            }
            const bnAmount = new BigNumber(amount)
            let outAmount = '0'
            let tokenContract
            let readTokenContract
            if (direction) {
              tokenContract = new ethers.Contract(dexpool.token0Id, erc20ABI, web3Provider)
              readTokenContract = new ethers.Contract(dexpool.token0Id, erc20ABI, provider)
              outAmount = await quoterContract.quoteExactInputSingle(
                dexpool.token1Id,
                dexpool.token0Id,
                dexpool.feetier,
                amount,
                0
              ).call()
            } else {
              tokenContract = new ethers.Contract(dexpool.token1Id, erc20ABI, web3Provider)
              readTokenContract = new ethers.Contract(dexpool.token0Id, erc20ABI, provider)
              outAmount = await quoterContract.quoteExactInputSingle(
                dexpool.token0Id,
                dexpool.token1Id,
                dexpool.feetier,
                amount,
                0
              ).call()
            }
            const allowance = await readTokenContract.allowance(wallet.address, '0xE592427A0AEce92De3Edee1F18E0157C05861564')
            if (new BigNumber(allowance).lt(bnAmount)){
              const uint256max = new BigNumber(2).pow(256).minus(1)
              this.trackActions(trackingOptions, {abi: erc20ABI.find(e => e.name === 'approve'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: ['0xE592427A0AEce92De3Edee1F18E0157C05861564', uint256max]})
              await tokenContract.approve('0xE592427A0AEce92De3Edee1F18E0157C05861564', uint256max)
            }
            const args = [
              direction ? dexpool.token1Id : dexpool.token0Id,
              direction ? dexpool.token0Id : dexpool.token1Id,
              dexpool.feetier,
              toAddress,
              new Date().getTime(),
              amount,
              outAmount,
              0
            ]
            await this.trackActions(trackingOptions, {abi: uniswapRouterABI.find(e => e.name === 'exactInputSingle'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: [args]})
            return routerContract.exactInputSingle(args)
          },
          swapQuote: async (direction: boolean, amount: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Uniswap') {
              throw new Error('Pool does not support swapQuote function')
            }
            if (direction) {
              return await readQuoterContract.quoteExactInputSingle(
                dexpool.token1Id,
                dexpool.token0Id,
                dexpool.feetier,
                amount,
                0
              )
            } else {
              return await readQuoterContract.quoteExactInputSingle(
                dexpool.token0Id,
                dexpool.token1Id,
                dexpool.feetier,
                amount,
                0
              )
            }
          },
          lendPoolGetUserAccountData: async (address?: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Aave') {
              throw new Error('Pool does not support GetUserAccountData function')
            }
            if (address) {
              return aaveContract.getUserAccountData(
                wallet.address
              )
            } else {
              return aaveContract.getUserAccountData(
                address
              )
            }
          },
          lendDeposit: async (amount: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dextokens
              },{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Aave') {
              throw new Error('Pool does not support Deposit function')
            }
            await this.trackActions(trackingOptions, {abi: aaveLendPoolABI.find(e => e.name === 'deposit'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: [dexpool.dextokens[0].id, amount, wallet.address, 0]})
            return await aaveContract.deposit(
              dexpool.dextokens[0].id,
              amount,
              wallet.address,
              0
            )
          },
          lendBorrow: async (amount: string, interestMode: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dextokens
              },{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Aave') {
              throw new Error('Pool does not support Borrow function')
            }
            await this.trackActions(trackingOptions, {abi: aaveLendPoolABI.find(e => e.name === 'borrow'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: [dexpool.dextokens[0].id, amount, interestMode, 0, wallet.address]})
            return await aaveContract.borrow(
              dexpool.dextokens[0].id,
              amount,
              interestMode,
              0,
              wallet.address
            )
          },
          lendWithdraw: async (amount: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dextokens
              },{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Aave') {
              throw new Error('Pool does not support Withdraw function')
            }
            await this.trackActions(trackingOptions, {abi: aaveLendPoolABI.find(e => e.name === 'withdraw'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: [dexpool.dextokens[0].id, amount, wallet.address]})
            return await aaveContract.withdraw(
              dexpool.dextokens[0].id,
              amount,
              wallet.address
            )
          },
          lendRepay: async (amount: string, interestMode: string) => {
            const dexpool = await models.dexpools.findOne({
              where: {id: poolAddress},
              include: [{
                model: models.dextokens
              },{
                model: models.dexes
              }]
            })
            if (dexpool === null) {
              throw new Error('Pool not in database')
            }
            if (dexpool.dex.name !== 'Aave') {
              throw new Error('Pool does not support Repay function')
            }
            await this.trackActions(trackingOptions, {abi: aaveLendPoolABI.find(e => e.name === 'repay'), address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', args: [dexpool.dextokens[0].id, amount, interestMode, wallet.address]})
            return await aaveContract.repay(
              dexpool.dextokens[0].id,
              amount,
              interestMode,
              wallet.address
            )
          },
        }
      },
      injectedABIs: injectedABIs,
      marketplace: {
        addToMarketplace: async (entryType: number, price: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const marketplaceContract = new ethers.Contract(config.app.marketplaceAddress, marketplaceABI, web3Provider)
          return marketplaceContract.addEntry(entryType,price,{value: 500})
        },
        purchase: async (entryId: string, price: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const marketplaceContract = new ethers.Contract(config.app.marketplaceAddress, marketplaceABI, web3Provider)
          return marketplaceContract.purchase(entryId,{value: price})
        },
        subscribe: async (entryId: string, price: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const marketplaceContract = new ethers.Contract(config.app.marketplaceAddress, marketplaceABI, web3Provider)
          return marketplaceContract.addUpdateSubPayee(entryId,{value: price})
        },
        unsubscribe: async (entryId: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const marketplaceContract = new ethers.Contract(config.app.marketplaceAddress, marketplaceABI, web3Provider)
          return marketplaceContract.endUpdateSubPayee(entryId)
        },
        close: async (entryId: string) => {
          const provider = new ethers.providers.JsonRpcProvider(wallet.nodeurl)
          const web3Provider = web3Wallet.connect(provider)
          const marketplaceContract = new ethers.Contract(config.app.marketplaceAddress, marketplaceABI, web3Provider)
          return marketplaceContract.closeEntry(entryId)
        }
      }
    }
    return this.wallets[wallet.name]
  }

  trackActions = async (trackingOptions: any, action: any) => {
    if (trackingOptions === undefined) return
    const subSessions = await models.subtradesessions.findAll({
      where: { tradesessionId: trackingOptions.options.id },
      include: { model: models.dexwallets }
    })
    for (const subSession of subSessions) {
      // signature
      const dexwallet = subSession.dexwallet
      const web3WalletSigner = await ethers.Wallet.fromMnemonic(dexwallet.seedphrase, "m/44'/60'/0'/0/" + dexwallet.walletindex)
      const message = `I am owner of ${dexwallet.address}`
      const signature = await web3WalletSigner.signMessage(message)
      // data payload
      const data = {
        type: 'blockchain',
        index: trackingOptions.index,
        action
      }
      // request
      try {
        await superagent
          .post(config.app.baseUri+'/api/v1/marketplace/'+subSession.remoteId+'/newevent')
          .type('application/json')
          .send({
            signature,
            message,
            data
          })
      } catch (e) {
        // console.log('er')
      }
    }
  }
}

const erc20ABI:any = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  },
  // transfer
  {
    "constant":true,
    "inputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],
    "name":"transfer",
    "outputs":[{"":"","type":"bool"}],
    "type":"function"
  },
  // allowance
  {
    "constant":true,
    "inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],
    "name":"allowance",
    "outputs":[{"name":"allowance","type":"uint256"}],
    "type":"function"
  },
  // approve
  {
    "constant":true,
    "inputs":[{"name":"spender","type":"address"},{"name":"ammount","type":"uint256"}],
    "name":"approve",
    "outputs":[{"name":"approved","type":"bool"}],
    "type":"function"
  },
];
export const marketplaceABI:any = [
  // addEntry
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_entryType",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      }
    ],
    "name": "addEntry",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "entryType",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "NewEntry",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_entryId",
        "type": "uint256"
      }
    ],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_entryId",
        "type": "uint256"
      }
    ],
    "name": "closeEntry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_entryId",
        "type": "uint256"
      }
    ],
    "name": "addUpdateSubPayee",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_entryId",
        "type": "uint256"
      }
    ],
    "name": "endUpdateSubPayee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const uniswapRouterABI:any = [
  // exactInputSingle
  {
    "constant":true,
    "inputs":[        {
      "components": [
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenOut",
          "type": "address"
        },
        {
          "internalType": "uint24",
          "name": "fee",
          "type": "uint24"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOutMinimum",
          "type": "uint256"
        },
        {
          "internalType": "uint160",
          "name": "sqrtPriceLimitX96",
          "type": "uint160"
        }
      ],
      "internalType": "struct ExactInputSingleParams",
      "name": "params",
      "type": "tuple"
    }],
    "name":"exactInputSingle",
    "outputs":[{"name":"amountOut","type":"uint256"}],
    "type":"function"
  },
  // exactOutputSingle
  {
    "constant":true,
    "inputs":[        {
      "components": [
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenOut",
          "type": "address"
        },
        {
          "internalType": "uint24",
          "name": "fee",
          "type": "uint24"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOutMinimum",
          "type": "uint256"
        },
        {
          "internalType": "uint160",
          "name": "sqrtPriceLimitX96",
          "type": "uint160"
        }
      ],
      "internalType": "struct ExactOutputSingleParams",
      "name": "params",
      "type": "tuple"
    }],
    "name":"exactOutputSingle",
    "outputs":[{"name":"amountIn","type":"uint256"}],
    "type":"function"
  },
];
const uniswapQuoterABI:any = [
  // quoteExactInputSingle
  {
    "constant":true,
    "inputs":[
      {"name":"tokenIn","type":"address"},
      {"name":"tokenOut","type":"address"},
      {"name":"fee","type":"uint24"},
      {"name":"amountIn","type":"uint256"},
      {"name":"sqrtPriceLimitX96","type":"uint160"}
    ],
    "name":"quoteExactInputSingle",
    "outputs":[
      {"name":"amountOut","type":"uint256"}
    ],
    "type":"function"
  },
  // quoteExactOutputSingle
  {
    "constant":true,
    "inputs":[
      {"name":"tokenIn","type":"address"},
      {"name":"tokenOut","type":"address"},
      {"name":"fee","type":"uint24"},
      {"name":"amountOut","type":"uint256"},
      {"name":"sqrtPriceLimitX96","type":"uint160"}
    ],
    "name":"quoteExactOutputSingle",
    "outputs":[
      {"name":"amountIn","type":"uint256"}
    ],
    "type":"function"
  }
];
const aaveLendPoolABI:any = [
  // getUserAccountData
  {
    "constant":true,
    "inputs":[
      {"name":"user","type":"address"}
    ],
    "name":"getUserAccountData",
    "outputs":[
      {"name":"totalCollateralETH","type":"uint256"},
      {"name":"totalDebtETH","type":"uint256"},
      {"name":"availableBorrowsETH","type":"uint256"},
      {"name":"currentLiquidationThreshold","type":"uint256"},
      {"name":"ltv","type":"uint256"},
      {"name":"healthFactor","type":"uint256"}
    ],
    "type":"function"
  },
  // deposit
  {
    "constant":true,
    "inputs":[
      {"name":"asset","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"onBehalfOf","type":"address"},
      {"name":"referralCode","type":"uint16"}
    ],
    "name":"deposit",
    "type":"function"
  },
  // withdraw
  {
    "constant":true,
    "inputs":[
      {"name":"asset","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"to","type":"address"}
    ],
    "name":"withdraw",
    "outputs":[{"name":"","type":"uint256"}],
    "type":"function"
  },
  // borrow
  {
    "constant":true,
    "inputs":[
      {"name":"asset","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"interestRateMode","type":"uint256"},
      {"name":"referralCode","type":"uint16"},
      {"name":"onBehalfOf","type":"address"}
    ],
    "name":"borrow",
    "type":"function"
  },
  // repay
  {
    "constant":true,
    "inputs":[
      {"name":"asset","type":"address"},
      {"name":"amount","type":"uint256"},
      {"name":"rateMode","type":"uint256"},
      {"name":"onBehalfOf","type":"address"}
    ],
    "name":"repay",
    "outputs":[{"name":"","type":"uint256"}],
    "type":"function"
  }
]