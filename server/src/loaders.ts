import * as ccxt from "ccxt"
import models from './models'
import { request, gql } from 'graphql-request'
import { logger } from './logger'

export const importSmartContracts = async () => {
  try {
    // load uniswap
    const chainId = 1
    const endpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
    for (let skip=0;skip<=5000;skip+=1000) {
      const smartContracts: any[] = []
      const tokens: any[] = []
      const tokenToSmartContracts: any[] = []
      const QUERY = gql`
      query pools($skip: Int!) {
        pools(first: 1000, skip: $skip, orderBy: volumeUSD, orderDirection: desc) {
          id
          feeTier
          volumeUSD
          txCount
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
      }
      `
      const req = await request(endpoint, QUERY, {skip})
      for(const entry of req.pools){
        tokens.push({
          id: entry.token0.id,
          symbol: entry.token0.symbol,
          name: entry.token0.name,
          decimals: entry.token0.decimals,
          dexchainId: chainId
        })
        tokens.push({
          id: entry.token1.id,
          symbol: entry.token1.symbol,
          name: entry.token1.name,
          decimals: entry.token1.decimals,
          dexchainId: chainId
        })
        smartContracts.push({
          address: entry.id,
          name: 'Uniswap',
          description: `Swap between ${entry.token0.symbol} and ${entry.token1.symbol}`,
          keywords: `swap ${entry.token1.symbol} ${entry.token0.symbol}`,
          dexchainId: chainId,
          data: `{
            view: {
              ui: [{
                  name: '${entry.token0.symbol}',
                  value: 'token0',
                  type: 'balance',
                  decimals: 18
                }, {
                  name: '${entry.token1.symbol}',
                  value: 'token1',
                  type: 'balance',
                  decimals: 18
              }],
              fn: async (walletId) => {
                const promises = await Promise.all([
                  web3Wallets[walletId].token('${entry.token0.id}').getBalance(web3Wallets[walletId].address),
                  web3Wallets[walletId].token('${entry.token1.id}').getBalance(web3Wallets[walletId].address)
                ])
                return {
                  token0: promises[0].toString(),
                  token1: promises[1].toString()
                }
              }
            },
            actions: {
              swap: {
                title: 'Swap',
                ui: [{
                    name: 'Wallet',
                    id: 'walletSelect',
                    type: 'walletSelect'
                  },{
                    name: 'Direction',
                    id: 'swapDirection',
                    type: 'select',
                    options: [{
                      title: '${entry.token0.symbol} to ${entry.token1.symbol}',
                      value: '1'
                    },{
                      title: '${entry.token1.symbol} to ${entry.token0.symbol}',
                      value: '-1'
                    }]
                  },{
                    name: 'Amount in',
                    conditions: {
                      swapDirection: '1'
                    },
                    id: 'amontIn',
                    type: 'balanceInput',
                    decimals: 18
                  },{
                    name: 'Amount in',
                    conditions: {
                      swapDirection: '-1'
                    },
                    id: 'amontIn',
                    type: 'balanceInput',
                    decimals: 18
                }],
                fn: async () => {
                  const allowance = await web3Wallets[inputs.walletSelect].readContractAction('0xE592427A0AEce92De3Edee1F18E0157C05861564', dexsmartcontract.dexsmartcontractabis, 'allowance', [web3Wallets[inputs.walletSelect].address])
                  if (allowance.lt(inputs.inputAmount)){
                    const uint256max = new BigNumber(2).pow(256).minus(1)
                    await web3Wallets[inputs.walletSelect].executeReadContractAction(inputs.swapDirection ? '${entry.token1.id}' : '${entry.token0.id}', dexsmartcontract.dexsmartcontractabis, 'approve', ['0xE592427A0AEce92De3Edee1F18E0157C05861564', uint256max])
                  }
                  const args = [
                    inputs.swapDirection ? '${entry.token0.id}' : '${entry.token1.id}',
                    inputs.swapDirection ? '${entry.token1.id}' : '${entry.token0.id}',
                    3,
                    web3Wallets[inputs.walletSelect].address,
                    new Date().getTime(),
                    inputs.inputsAmount,
                    0,
                    0
                  ]
                  return web3Wallets[inpus.walletSelect].executeContractAction('0xE592427A0AEce92De3Edee1F18E0157C05861564', dexsmartcontract.dexsmartcontractabis, 'exactInputSingle', args)
                }
              }
            }
          }`,
          dexsmartcontractsabiName: 'Uniswapv3'
        })
        tokenToSmartContracts.push({
          dexsmartcontractId: entry.id,
          dextokenId: entry.token0.id
        })
        tokenToSmartContracts.push({
          dexsmartcontractId: entry.id,
          dextokenId: entry.token1.id
        })
      }
      await models.dextokens.bulkCreate(tokens, { ignoreDuplicates: true })
      await models.dexsmartcontracts.bulkCreate(smartContracts, { ignoreDuplicates: true })
      await models.dexsmartcontractstokens.bulkCreate(tokenToSmartContracts, { ignoreDuplicates: true })
    }
  } catch (e) {
    logger.log('info', 'failed getting uniswap pools ' + e)
  }
  /*
  try {
    // load aave
    const endpoint = 'https://cache-api-1.aave.com/graphql'
    for (let skip=0;skip<=5000;skip+=1000) {
      const smartContracts: any[] = []
      const tokens: any[] = []
      const tokenToSmartContracts: any[] = []
      const QUERY = gql`
      query C_ProtocolData($lendingPoolAddressProvider: String!, $chainId: Int!) {
        protocolData(
          lendingPoolAddressProvider: $lendingPoolAddressProvider
          chainId: $chainId
        ) {
          reserves {
            ...ReserveDataFragment
            __typename
          }
          baseCurrencyData {
            ...BaseCurrencyDataFragment
            __typename
          }
          __typename
        }
      }
      
      fragment ReserveDataFragment on ReserveData {
        id
        underlyingAsset
        name
        symbol
        decimals
        isActive
        isFrozen
        usageAsCollateralEnabled
        aTokenAddress
        stableDebtTokenAddress
        variableDebtTokenAddress
        borrowingEnabled
        stableBorrowRateEnabled
        reserveFactor
        interestRateStrategyAddress
        baseLTVasCollateral
        stableRateSlope1
        stableRateSlope2
        averageStableRate
        stableDebtLastUpdateTimestamp
        variableRateSlope1
        variableRateSlope2
        liquidityIndex
        reserveLiquidationThreshold
        reserveLiquidationBonus
        variableBorrowIndex
        variableBorrowRate
        availableLiquidity
        stableBorrowRate
        liquidityRate
        totalPrincipalStableDebt
        totalScaledVariableDebt
        lastUpdateTimestamp
        priceInMarketReferenceCurrency
        isPaused
        accruedToTreasury
        unbacked
        isolationModeTotalDebt
        debtCeiling
        debtCeilingDecimals
        eModeCategoryId
        borrowCap
        supplyCap
        eModeLtv
        eModeLiquidationThreshold
        eModeLiquidationBonus
        eModePriceSource
        eModeLabel
        borrowableInIsolation
        baseStableBorrowRate
        baseVariableBorrowRate
        optimalUsageRatio
        priceOracle
        __typename
      }
      
      fragment BaseCurrencyDataFragment on BaseCurrencyData {
        marketReferenceCurrencyDecimals
        marketReferenceCurrencyPriceInUsd
        networkBaseTokenPriceInUsd
        networkBaseTokenPriceDecimals
      }
      `
      const aaveLendingPool = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5"
      const req = await request(endpoint, QUERY, {
        lendingPoolAddressProvider: aaveLendingPool,
        chainId: 1
      })
      // process
      smartContracts.push({
        id: aaveLendingPool,
        name: 'Aave',
        description: 'Borrow assets',
        keywords: 'borrow repay',
        data: {
          abi: 'biba aave'
        }
      })
      for(const entry of req.protocolData.reserves){
        smartContracts[0].keywords = smartContracts[0].keywords + ` ${entry.symbol}`
        tokens.push({
          id: entry.underlyingAsset,
          symbol: entry.symbol,
          decimals: entry.decimals
        })
        tokenToSmartContracts.push({
          dexsmartcontractId: aaveLendingPool,
          dextokenId: entry.underlyingAsset
        })
      }
      await models.dextokens.bulkCreate(tokens, { ignoreDuplicates: true })
      await models.dexsmartcontracts.bulkCreate(smartContracts, { ignoreDuplicates: true })
      await models.dexsmartcontractstokens.bulkCreate(tokenToSmartContracts, { ignoreDuplicates: true })
    }
  } catch (e) {
    logger.log('info', 'failed getting uniswap pools ' + e)
  }
  */
}

export const importIfNotInPoolsTokens = async () => {
  const count0 = await models.dexchains.count()
  const count1 = await models.dextokens.count()
  const count2 = await models.dexsmartcontracts.count()
  const count3 = await models.dexsmartcontractsabis.count()
  if (count0 === 0 || count1 === 0 || count2 === 0 || count3 === 0) {
    importChains()
    importSmartContracts()
  }
}

export const importChains = async () => {
  await models.dexchains.create({id: 1, name: 'Ethereum', currency: 'ETH', rpc:'https://ethereum.publicnode.com', txexplorer: 'https://etherscan.io/tx/', derivationPath: "m/44'/60'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 56, name: 'Binance Smart Chain', currency: 'BNB', rpc:'https://bsc-dataseed.binance.org', txexplorer: 'https://bscscan.com/tx/', derivationPath: "m/44'/714'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 137, name: 'Polygon', currency: 'MATIC', rpc:'https://polygon-bor.publicnode.com', txexplorer: 'https://polygonscan.com/tx/', derivationPath: "m/44'/966'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 42161, name: 'Arbitrum One', currency: 'ETH', rpc:'https://arb1.arbitrum.io/rpc', txexplorer: 'https://arbiscan.io/tx/', derivationPath: "m/44'/60'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 10, name: 'Optimism', currency: 'ETH', rpc:'https://mainnet.optimism.io', txexplorer: 'https://optimistic.etherscan.io/tx/', derivationPath: "m/44'/60'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 43114, name: 'Avalance C-Chain', currency: 'AVAX', rpc:'https://avalanche-evm.publicnode.com', txexplorer: 'https://snowtrace.io/tx/', derivationPath: "m/44'/9000'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 250, name: 'Fantom Opera', currency: 'FTM', rpc:'https://rpcapi.fantom.network', txexplorer: 'https://ftmscan.com/tx/', derivationPath: "m/44'/1007'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 100, name: 'Gnosis', currency: 'xDAI', rpc:'https://xdai-rpc.gateway.pokt.network', txexplorer: 'https://gnosisscan.io/tx/', derivationPath: "m/44'/700'/0'/0/" }, { ignoreDuplicates: true })
  await models.dexchains.create({id: 42220, name: 'Celo', currency: 'CELO', rpc:'https://forno.celo.org', txexplorer: 'https://celoscan.io/tx/', derivationPath: "m/44'/52752'/0'/0/" }, { ignoreDuplicates: true })
}

export const loadExchanges = async () => {
  // cctx
  const exchangeCapabilities = [
    'publicAPI',
    'privateAPI',
    'CORS',
    'fetchTicker',
    'fetchTickers',
    'fetchOrderBook',
    'fetchTrades',
    'fetchOHLCV',
    'fetchBalance',
    'createOrder',
    'createMarketOrder',
    'createLimitOrder',
    'editOrder',
    'cancelOrder',
    'cancelOrders',
    'cancelAllOrders',
    'fetchOrder',
    'fetchOrders',
    'fetchOpenOrders',
    'fetchClosedOrders',
    'fetchMyTrades',
    'fetchOrderTrades',
    'fetchCurrencies',
    'fetchDepositAddress',
    'createDepositAddress',
    'fetchTransactions',
    'fetchDeposits',
    'fetchWithdrawals',
    'withdraw',
    'fetchLedger',
    'fetchFundingFees',
    'fetchTradingFees',
    'fetchTradingLimits',
  ]
  for (const exchange of ccxt.exchanges) {
    const ex = new ccxt[exchange]
    let count = 0
    let functions = {}
    for (let key of exchangeCapabilities) {
      let capability = ex.has[key]?.toString()
      if (capability === 'true' || capability === 'emulated') {
        count += 1
      }
      functions[key] = capability
    }
    await models.exchanges.create({
      type: 'ccxt',
      exchange: exchange,
      name: ex.name,
      supported: count,
      functions,
      url: ex.urls.www,
      logo: ex.urls.logo,
      countries: ex.countries
    }, { ignoreDuplicates: true })
  }
  // dexes
  await models.dexes.create({name: 'Uniswap'}, { ignoreDuplicates: true })
  await models.dexes.create({name: 'Aave'}, { ignoreDuplicates: true })
  await models.dexsmartcontractsabis.create({
    name: 'Uniswapv3',
    abis: [{
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
    },
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
    }]
  }, { ignoreDuplicates: true })
}