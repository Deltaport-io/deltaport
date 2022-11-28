import * as ccxt from "ccxt"
import models from './models'
import { request, gql } from 'graphql-request'
import { logger } from './logger'

export const importSmartContracts = async () => {
  try {
    // load uniswap
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
          decimals: entry.token0.decimals
        })
        tokens.push({
          id: entry.token1.id,
          symbol: entry.token1.symbol,
          name: entry.token1.name,
          decimals: entry.token1.decimals
        })
        smartContracts.push({
          id: 'Uniswapv3:'+entry.id,
          address: entry.id,
          name: 'Uniswap',
          description: `Swap between ${entry.token0.symbol} and ${entry.token1.symbol}`,
          keywords: `swap ${entry.token1.symbol} ${entry.token0.symbol}`,
          data: {
            abi: 'biba'
          },
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
  const count1 = await models.dextokens.count()
  const count2 = await models.dexpools.count()
  const count3 = await models.dexsmartcontracts.count()
  const count4 = await models.dexsmartcontractsabis.count()
  if (count1 === 0 || count2 === 0 || count3 === 0 || count4 === 0) {
    loadDexPoolsTokens()
    importSmartContracts()
  }
}

export const loadDexPoolsTokens = async () => {
  try {
    // load uniswap
    const dex = await models.dexes.findOne({where:{name:'Uniswap'}})
    const endpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
    for (let skip=0;skip<=5000;skip+=1000) {
      const pools: any[] = []
      const tokens: any[] = []
      const tokenToPools: any[] = []
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
          decimals: entry.token0.decimals
        })
        tokens.push({
          id: entry.token1.id,
          symbol: entry.token1.symbol,
          name: entry.token1.name,
          decimals: entry.token1.decimals
        })
        pools.push({
          id: entry.id,
          data: {
            volume: entry.volumeUSD,
            txcount: entry.txCount,
            feetier: entry.feeTier,
            token1: {
              id: entry.token1.id,
              symbol: entry.token1.symbol
            },
            token0: {
              id: entry.token0.id,
              symbol: entry.token0.symbol
            }
          },
          dexId: dex.id
        })
        tokenToPools.push({
          dexpoolId: entry.id,
          dextokenId: entry.token0.id
        })
        tokenToPools.push({
          dexpoolId: entry.id,
          dextokenId: entry.token1.id
        })
      }
      await models.dextokens.bulkCreate(tokens, { ignoreDuplicates: true })
      await models.dexpools.bulkCreate(pools, { ignoreDuplicates: true })
      await models.dexpooltokens.bulkCreate(tokenToPools, { ignoreDuplicates: true })
    }
  } catch (e) {
    logger.log('info', 'failed getting uniswap pools ' + e)
  }
  try {
    // load aave
    const dex = await models.dexes.findOne({where:{name:'Aave'}})
    const endpoint = 'https://cache-api-1.aave.com/graphql'
    for (let skip=0;skip<=5000;skip+=1000) {
      const pools: any[] = []
      const tokens: any[] = []
      const tokenToPools: any[] = []
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
      const req = await request(endpoint, QUERY, {
        lendingPoolAddressProvider:"0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",
        chainId:1
      })
      // process
      for(const entry of req.protocolData.reserves){
        pools.push({
          id: entry.id,
          data: {
            reserveFactor: entry.reserveFactor,
            stableRateSlope1: entry.stableRateSlope1,
            stableRateSlope2: entry.stableRateSlope2,
            variableRateSlope1: entry.variableRateSlope1,
            variableRateSlope2: entry.variableRateSlope2
          },
          dexId: dex.id
        })
        tokens.push({
          id: entry.underlyingAsset,
          symbol: entry.symbol,
          decimals: entry.decimals
        })
        tokenToPools.push({
          dexpoolId: entry.id,
          dextokenId: entry.underlyingAsset
        })
      }
      await models.dextokens.bulkCreate(tokens, { ignoreDuplicates: true })
      await models.dexpools.bulkCreate(pools, { ignoreDuplicates: true })
      await models.dexpooltokens.bulkCreate(tokenToPools, { ignoreDuplicates: true })
    }
  } catch (e) {
    logger.log('info', 'failed getting uniswap pools ' + e)
  }
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