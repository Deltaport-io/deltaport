import * as ccxt from "ccxt"
import models from './models'
import { request, gql } from 'graphql-request'
import { logger } from './logger'

export const importIfNotInPoolsTokens = async () => {
  const count1 = await models.dextokens.count()
  const count2 = await models.dexpools.count()
  if (count1 === 0 || count2 === 0) {
    loadDexPoolsTokens()
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
}