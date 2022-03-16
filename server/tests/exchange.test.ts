import { mockExchange } from '../src/mockExchange'

test('test mockExchange', async () => {

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

  console.log('start', exchange.balances)

  // create order
  await exchange.createMarketBuyOrder('BTC/USD', 1)
  
  console.log('post buy 1', exchange.balances)

  // tick
  const newprices = [{
    symbol: 'BTC/USD',
    price: 1200
  }]
  exchange.tick(timestamp, newprices)

  console.log('tick 1200', exchange.balances)

  await exchange.createMarketSellOrder('BTC/USD', 1)

  console.log('post sell 1', exchange.balances)


  // console.log('orders', exchange.orders)
  // console.log('trades', exchange.trades)
  // console.log('positions', exchange.positions)


  expect(true).toBe(true)
});