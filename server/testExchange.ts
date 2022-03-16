import mockExchange from './src/mockExchange'

const main = async () => {

  // balances
  const balances = [{
    currency: 'USD',
    amount: 5000
  }]
  
  // init exchange
  const exchange = new mockExchange()
  await exchange.init('BitmexLive', balances)
  // prepare for tick
  const timestamp = new Date().getTime()

  // tick
  const prices = [{
    symbol: 'BTC/USD',
    price: 1000
  }]
  exchange.tick(timestamp, prices)

  // create order
  await exchange.createMarketBuyOrder('BTC/USD', 1)
  
  // tick
  const newprices = [{
    symbol: 'BTC/USD',
    price: 1200
  }]
  exchange.tick(timestamp, newprices)

  // await exchange.createMarketBuyOrder('BTC/USD', 1)
  await exchange.createMarketSellOrder('BTC/USD', 1)

  console.log('balances', exchange.balances)
  // console.log('orders', exchange.orders)
  // console.log('trades', exchange.trades)
  // console.log('positions', exchange.positions)

}

main()