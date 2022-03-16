import * as ccxt from "ccxt"
import models from './models'
import { request, gql } from 'graphql-request'
import { logger } from './logger'

export const loadDexPoolsTokens = async () => {
  try {
    // load uniswap
    const dex = await models.dexes.findOne({where:{name:'Uniswap'}})
    const endpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
    for (let skip=0;skip<=5000;skip+=1000) {
      const pools: any[] = []
      const tokens: any[] = []
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
          token0Id: entry.token0.id,
          token1Id: entry.token1.id,
          volume: entry.volumeUSD,
          txcount: entry.txCount,
          feetier: entry.feeTier,
          dexId: dex.id
        })
      }
      await models.dextokens.bulkCreate(tokens, { ignoreDuplicates: true })
      await models.dexpools.bulkCreate(pools, { ignoreDuplicates: true })
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
  await models.dexes.create({name: 'SushiSwap'}, { ignoreDuplicates: true })
}