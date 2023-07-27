import * as uuid from 'short-uuid'

export class mockExchange {

  account:any = {}
  pairs: any = {}

  balances: any = {}
  orders: any = {}
  trades: any = {}
  positions: any = {}
  prices: any = {}
  timestamp

  private currencyBalance = (currency:string) => {
    if (this.balances[currency] === undefined) {
      this.balances[currency] = {total: 0, used: 0, free: 0}
    }
    return this.balances[currency]
  }

  private mergeArrays = (obj:any) => {
    let full: any[] = []
    for(const key in obj) {
      full = [...full, ...obj[key]];
    }
    return full
  }

  init = async (account: any, balances: any) => {
    for (const pair of account.pairs) {
      this.pairs[pair.pair] = pair.dataValues
    }
    if (balances) {
      for (const balance of balances) {
        this.balances[balance.currency] = {
          total: balance.amount,
          used: 0,
          free: balance.amount
        }
      }
    }
    this.timestamp = 0
  }

  tick = async (timestamp: number, prices: any) => {
    // update local state
    this.timestamp = timestamp
    for (const symbol in prices) {
      const price = prices[symbol]
      // for (const price of prices) {
      this.prices[symbol] = price
      // update positions and total if open
      if (Array.isArray(this.positions[symbol])) {
        const positionIndex = this.positions[symbol].findIndex(position => position.status === 'open')
        if (positionIndex >= 0) {
          // update position
          const contracts = this.positions[symbol][positionIndex].contracts
          const tempNotional = this.prices[symbol] * contracts
          this.currencyBalance(this.pairs[symbol].quote).total = this.currencyBalance(this.pairs[symbol].quote).free + tempNotional
          if (this.positions[symbol][positionIndex].params.stopLossPrice !== undefined) {
            if (this.positions[symbol][positionIndex].side === 'short' && this.prices[symbol] >= this.positions[symbol][positionIndex].params.stopLossPrice) {
              await this.createOrder(symbol, 'market', 'buy', contracts, this.positions[symbol][positionIndex].params.stopLossPrice)
            }
            if (this.positions[symbol][positionIndex].side === 'long' && this.prices[symbol] <= this.positions[symbol][positionIndex].params.stopLossPrice) {
              await this.createOrder(symbol, 'market', 'sell', contracts, this.positions[symbol][positionIndex].params.stopLossPrice)
            }
          }
          if (this.positions[symbol][positionIndex].params.takeProfitPrice !== undefined) {
            if (this.positions[symbol][positionIndex].side === 'short' && this.prices[symbol] <= this.positions[symbol][positionIndex].params.takeProfitPrice) {
              await this.createOrder(symbol, 'market', 'buy', contracts, this.positions[symbol][positionIndex].params.takeProfitPrice)
            }
            if (this.positions[symbol][positionIndex].side === 'long' && this.prices[symbol] >= this.positions[symbol][positionIndex].params.takeProfitPrice) {
              await this.createOrder(symbol, 'market', 'sell', contracts, this.positions[symbol][positionIndex].params.takeProfitPrice)
            }
          }
        }
      }
    }
  }

  createOrder = async (symbol, type, side, amount, price = undefined, params = {}) => {
    if (this.pairs[symbol] === undefined) {
      throw new Error('Symbol not found')
    }
    price = this.prices[symbol]
    if (side === 'buy') {
      this.currencyBalance(this.pairs[symbol].base).total = this.currencyBalance(this.pairs[symbol].base).total + amount
      this.currencyBalance(this.pairs[symbol].base).free = this.currencyBalance(this.pairs[symbol].base).free + amount
      this.currencyBalance(this.pairs[symbol].quote).total = this.currencyBalance(this.pairs[symbol].quote).total - amount * price
      this.currencyBalance(this.pairs[symbol].quote).free = this.currencyBalance(this.pairs[symbol].quote).free - amount * price
    } else {
      this.currencyBalance(this.pairs[symbol].base).total = this.currencyBalance(this.pairs[symbol].base).total - amount
      this.currencyBalance(this.pairs[symbol].base).free = this.currencyBalance(this.pairs[symbol].base).free - amount
      this.currencyBalance(this.pairs[symbol].quote).total = this.currencyBalance(this.pairs[symbol].quote).total + amount * price
      this.currencyBalance(this.pairs[symbol].quote).free = this.currencyBalance(this.pairs[symbol].quote).free + amount * price
    }
    // POSITION
    if (this.positions[symbol] === undefined) {
      this.positions[symbol] = []
    }
    // check balance
    if (amount * price > this.currencyBalance(this.pairs[symbol].quote).free) {
      throw new Error('No enough balance')
    }
    // open position?
    const positionIndex = this.positions[symbol].findIndex(position => position.status === 'open')
    if (positionIndex > -1) {
      // update open position
      const oldPosition = this.positions[symbol][positionIndex]
      let newSide
      let newContracts
      let newPrice
      let newMarkPrice
      let newNotional
      let newStatus
      if (
        (side === 'buy' && oldPosition.side === 'long') ||
        (side === 'sell' && oldPosition.side === 'short')
      ) {
        newContracts = oldPosition.contracts + amount
        newNotional = oldPosition.notional + (amount * price)
        newSide = oldPosition.side
        this.currencyBalance(this.pairs[symbol].quote).free = this.currencyBalance(this.pairs[symbol].quote).free - newNotional
      } else {
        newContracts = oldPosition.contracts - amount
        newNotional = (amount * price)
        newSide = oldPosition.side
        if (newContracts < 0) {
          newSide = side === 'buy' ? 'short' : 'long'
          const negativeValue = newContracts * price
          newContracts = Math.abs(newContracts)
          const closureValue = oldPosition.contracts * price
          const updatedValue = closureValue + negativeValue
          this.currencyBalance(this.pairs[symbol].quote).free += updatedValue
        } else {
          this.currencyBalance(this.pairs[symbol].quote).free += newNotional
        }
      }
      // check for 
      if (newContracts === 0) {
        newStatus = 'closed'
        newPrice = price
        newMarkPrice = newPrice
      } else {
        newStatus = 'open'
        newPrice = newNotional / newContracts
        newMarkPrice = newPrice
      }
      this.positions[symbol][positionIndex] = {
        id: oldPosition.id,
        symbol: oldPosition.symbol,
        timestamp: oldPosition.timestamp,
        datetime: oldPosition.datetime,
        isolated: true,
        hedged: false,
        side: newSide,
        contracts: newContracts,
        price: newPrice,
        markPrice: newMarkPrice,
        notional: newNotional,
        leverage: oldPosition.leverage,
        collateral: newNotional,
        initialMargin: newNotional,
        maintenanceMargin: 0,
        initialMarginPercentage: 100,
        maintenanceMarginPercentage: 100,
        unrealizedPnl: 0,
        liquidationPrice: 0,
        status: newStatus,
        params: params
      }
    } else {
      // create new position
      const position = {
        id: uuid.generate(),
        symbol: symbol,
        timestamp: this.timestamp,
        datetime: new Date(this.timestamp).toISOString(),
        isolated: true,
        hedged: false,
        side: side === 'buy' ? 'long': 'short',
        contracts: amount,
        price: price,
        markPrice: price,
        notional: amount * price,
        leverage: 1,
        collateral: price,
        initialMargin: price,
        maintenanceMargin: 0,
        initialMarginPercentage: 100,
        maintenanceMarginPercentage: 100,
        unrealizedPnl: 0,
        liquidationPrice: 0,
        status: 'open',
        params: params
      }
      this.positions[symbol].push(position)
      this.currencyBalance(this.pairs[symbol].quote).free = this.currencyBalance(this.pairs[symbol].quote).free - position.notional
    }
    // TRADE
    const orderId = uuid.generate()
    const trade = {
      id: uuid.generate(),
      timestamp: this.timestamp,
      datetime: new Date(this.timestamp).toISOString(),
      symbol: symbol,
      order: orderId,
      type: type,
      side: side,
      takerOrMaker: 'taker',
      price: price,
      amount: amount,
      cost: price * amount,
      fee: {
        currency: '',
        cost: 0,
        rate: 0
      }
    }
    if (this.trades[symbol] === undefined) {
      this.trades[symbol] = []
    }
    this.trades[symbol].push(trade)
    // ORDER
    if (this.orders[symbol] === undefined) {
      this.orders[symbol] = []
    }
    const order = {
      id: orderId,
      clientOrderId: '',
      datetime: new Date(this.timestamp).toISOString(),
      timestamp: this.timestamp,
      lastTradeTimestamp: this.timestamp,
      status: 'closed',
      symbol: symbol,
      type: type,
      timeInForce: 'GTC',
      side: side,
      price: price,
      average: price,
      amount: amount,
      filled: amount,
      remaining: 0,
      cost: amount * price,
      trades: [trade],
      fee: {
        currency: '',
        cost: 0,
        rate: 0
      }
    }
    this.orders[symbol].push(order)
    return order
  }
  createLimitBuyOrder = async (symbol, amount, price, params = {}) => {
    return this.createOrder(symbol, 'limit', 'buy', amount, price, params)
  }
  createLimitSellOrder = async (symbol, amount, price, params = {}) => {
    return this.createOrder(symbol, 'limit', 'sell', amount, price, params)
  }
  createMarketBuyOrder = async (symbol, amount, params = {}) => {
    return this.createOrder(symbol, 'market', 'buy', amount, undefined, params)
  }
  createMarketSellOrder = async (symbol, amount, params = {}) => {
    return this.createOrder(symbol, 'market', 'sell', amount, undefined, params)
  }
  cancelOrder = async (id, symbol = undefined) => {
    return false
  }
  fetchOrders = async (symbol = undefined, since = undefined, limit = undefined) => {
    if (symbol) {
      return this.orders[symbol]
    } else {
      return this.mergeArrays(this.orders)
    }
  }
  fetchOpenOrders = async (symbol = undefined, since = undefined, limit = undefined) => {
    if (symbol) {
      return this.orders[symbol].filter((order:any) => order.status === 'open')
    } else {
      const orders = this.mergeArrays(this.orders)
      return orders.filter((order:any) => order.status === 'open')
    }
  }
  fetchClosedOrders = async (symbol = undefined, since = undefined, limit = undefined) => {
    if (symbol) {
      return this.orders[symbol].filter((order:any) => order.status === 'closed')
    } else {
      const orders = this.mergeArrays(this.orders)
      return orders.filter((order:any) => order.status === 'closed')
    }
  }
  fetchOrder = async (id, symbol = undefined) => {
    if (symbol) {
      return this.orders[symbol].filter((order:any) => order.id === id)
    } else {
      const orders = this.mergeArrays(this.orders)
      return orders.filter((order:any) => order.id === id)
    }
  }
  fetchPositions = async () => {
    return this.mergeArrays(this.positions)
  }
  fetchBalance = async () => {
    let balances = Object.assign({}, this.balances)
    balances.timestamp = this.timestamp
    balances.datetime = new Date(this.timestamp).toISOString()
    balances.free = {}
    balances.used = {}
    balances.total = {}
    for (const key in this.balances) {
      balances.free[key] = this.balances[key].free
      balances.used[key] = this.balances[key].used
      balances.total[key] = this.balances[key].total
    }
    return balances
  }
}