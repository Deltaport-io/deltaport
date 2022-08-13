Docs
============

* [Bot sandbox](#bot-sandbox)
* [REST APIs](#rest-apis)

# Bot sandbox #

* [Bot structure](#bot-structure)
  * [loader](#loader)
  * [onStart](#onstart)
  * [onTick](#ontick)
  * [onEnd](#onend)
* [Sandbox](#sandbox)
  * [Globals](#globals)
  * [Console](#console) (logging)
  * [Graph](#graph) (graphs)
  * [Data](#data)
  * [Exchange](#exchange) 
  * [Ethereum](#ethereum) 
  * [Indicators](#indicators)
  * [BigNumber](#bignumber) 
  * [TF](#tensorflow) (Tensorflow)
  * [Superagent](#superagent) (http requests)

## Bot structure ##

Bot code is written in sandboxed javascript with most of functions removed. Interaction with system can be done in 4 main objects/functions. Loader object acts as configuration of which exhanges, pairs, wallets are loaded for execution. onStart, onTick and onEnd functions are executed during bot execution and should be main source of bot actions.

* [loader](#loader)
* [onStart](#onstart)
* [onTick](#ontick)
* [onEnd](#onend)

### Loader ###

Loaders prepares or starts retrieving all data required for bot to run. Some parameters are marked with 'BACKTESTING ONLY' which only apply to when running backtests. Backtesting supports exchange trading and direct ethereum transfers (using pool swaps is not supported yet).

```javascript
// loader object
loader = {
    // OPTIONAL: array of exchanges to load
    exchanges: [{
        // identifier of connected exchange
        exchange: 'BitmexLive',
        // array of pair objects
        pairs: [{
            // identifier of pair to load
            pair: 'ETH/USD',
            // timeframe of pair
            timeframe: '1m',
            // BACKTESTING ONYL: start of pair retrieval
            start: '2022/01/01 00:00:00',
            // BACKTESTING ONLY: end of pair retrieval
            end: '2022/02/01 00:00:00'
        }],
        // BACKTESTING ONLY: array of mocked balances
        balances: [{
            // currency identifier
            currency: 'BTC',
            // amount of currency
            amount: 10
        }]
    }],
    // OPTIONAL: array of ethereum wallets to load
    ethereum: [{
        // identifier of wallet
        wallet: 'MyWallet',
        // BACKTESTING ONLY: array of mocked balances
        balances: [{
            // currency ETH gives ethereum to account
            currency: 'ETH',
            // amount of ETH
            amount: 100
        },{
            // contract address gives amount of ERC20 tokens to wallet
            currency: '0x567eb615575d06917efb8e92f1f754cdcf9b57d1', 
            // amount of tokens
            amount: 1000
        }]
        // OPTIONAL: custom ABIs you want to use
        injectedABIs: [{
            // name of contract
            name: 'MyContract',
            // ABI objects
            abi: [{
                "constant":true,
                "inputs":[{"name":"_owner","type":"address"}],
                "name":"balanceOf",
                "outputs":[{"name":"balance","type":"uint256"}],
                "type":"function"
            }]
        }]
    }]
}
```

### onStart ###

onStart function is executed once after data has been loaded and before onTick events start to come in.

```javascript
onStart = async() => {
    // example action:
    await console.log('we are starting')
}
```

### onTick ###

onTick function is executed on each retrieved data in backtesting and every few seconds depending on new live data in trading.

```javascript
// ticks is object that includes current system time as timestamp and data object with newely arrived data. Data object includes exchange, pair and timestamp information for each tick.
onTick = async(ticks) => {
  await console.log('on tick', ticks)
  // prints out:
  // "on tick", {timestamp: 1645567200000, data:[{"exchange":"BitmexLive","pair":"ETH/USD","timestamp":1645567200000}, ...]}
  // all new data is stored in this.data and can be accessed anytime
  await console.log(this.data["BitmexLive"]["ETH/USD"].close[0])
  await console.log(this.data["BitmexLive"]["ETH/USD"].open[0])
  await console.log(this.data["BitmexLive"]["ETH/USD"].high[0])
  await console.log(this.data["BitmexLive"]["ETH/USD"].low[0])
}
```

### onEnd ###

onEnd function is executed once after backtesting has been finished or when trading has been stopped.

```javascript
onEnd = async() => {
    // example action
    await console.log('we are done!')
}
```

## Sandbox ##

Sandbox is created by using [vm2](https://github.com/patriksimek/vm2) and injected with all following functions and objects.

### Globals ###

Before creating new varables or functions remember to not overwriting injected objects and functions.

```javascript
// example var
const newVar = 0
// example function
const newFunction = () => {
  await console.log('new function')
}
onStart = async() => {
    await console.log('we are done!')
}
```

### Console ###

Console can be used same way as in javascript with exception that they are promises. To ensure all logs are ordered properly it is recomended to use await.

```javascript
await console.log('this is log', 1234)
await console.info('this is info', 1234)
await console.warn('this is warn', 1234)
await console.error('this is error', 1234)
```

### Graphs ###

Graphs can be used similarly as console with exception that data will be shown in graphs in UI. To ensure all graphs are ordered properly it is recomended to use await. It is possible to have multiple graphs displayed with multimple keys per graph.

```javascript
// await graph.log(<name of graph>, <name of key>, <value to graph>)
await graph.log('MainGraph', 'Balance', 100)
await graph.log('MainGraph', 'Remaining', 50)
// next tick
await graph.log('MainGraph', 'Balance', 90)
await graph.log('MainGraph', 'Remaining', 60)
```

### Data ###

All loaded/current pair data can be accessed by this.pairs object where first key in object represents exchange alias and second pair name. Inside there are all candlestick information stored in arrays ordered where newest data has lowest index.

```javascript
// latest data
this.data["BitmexLive"]["ETH/USD"].close[0]
this.data["BitmexLive"]["ETH/USD"].open[0]
this.data["BitmexLive"]["ETH/USD"].high[0]
this.data["BitmexLive"]["ETH/USD"].low[0]
this.data["BitmexLive"]["ETH/USD"].volume[0]
// old, previous data
this.data["BitmexLive"]["ETH/USD"].close[1]
...
```

### Exchange ###

Loaded exchanges and all its functions can be accessed by this.exchanges object.
Where first key in object represents exchange alias. Returned object is [ccxt](https://github.com/ccxt/ccxt) connected object (check ccxt docs for more info).

```javascript
await this.exchanges['BitmexLive'].fetchBalance()
await this.exchanges['BitmexLive'].fetchPositions()
await this.exchanges['BitmexLive'].createOrder(symbol, type, side, amount, price:optional)
await this.exchanges['BitmexLive'].createLimitBuyOrder(symbol, amount, price)
await this.exchanges['BitmexLive'].createLimitSellOrder(symbol, amount, price)
await this.exchanges['BitmexLive'].createMarketBuyOrder(symbol, amount)
await this.exchanges['BitmexLive'].createMarketSellOrder(symbol, amount)
await this.exchanges['BitmexLive'].cancelOrder(id, symbol:optional)
await this.exchanges['BitmexLive'].fetchOrders(symbol:optional, since:optional, limit:optional)
await this.exchanges['BitmexLive'].fetchOpenOrders(symbol:optinal, since:optinal, limit:optinal)
await this.exchanges['BitmexLive'].fetchClosedOrders(symbol:optinal, since:optinal, limit:optinal)
await this.exchanges['BitmexLive'].fetchOrder(id, symbol:optinal)
```

### Ethereum ###

Loaded ethereum wallets can be accessed by this.ethereum object where first key represents loaded wallet alias. Transactions can take some time to process depending on ethereum network weather so use await (blocks execution of bot) or handle it inside bot.

```javascript
// get myWallet balance
await this.ethereum['MyWallet'].getBalance()
// get balance of 0x82... address
await this.ethereum['MyWallet'].getBalance('0x82...')
// get token 0xed... balance of myWallet
await this.ethereum['MyWallet'].token('0xed...').getBalance()
// get token 0xed... balance of 0x82... address
await this.ethereum['MyWallet'].token('0xed...').getBalance('0x82...')
// transfer token 0xed... from MyWallet addres to 0x33... of amount 100
await this.ethereum['MyWallet'].token('0xed...').transfer('0x33...', '100')
// swap with Uniswap pool 0xcc... from MyWallet addres to 0x33... in primary direction of amount 100
await this.ethereum['MyWallet'].pool('0xcc...').swap('0x33...', true, '100')
// get quote for swap with Uniswap pool 0xcc... in primary direction of amount 100
await this.ethereum['MyWallet'].pool('0xcc...').swapQuote(true, '100')
// get Aave pool info about MyWallet address
await this.ethereum['MyWallet'].pool('0xcc...').lendPoolGetUserAccountData()
// get Aave pool info about address 0x33...
await this.ethereum['MyWallet'].pool('0xcc...').lendPoolGetUserAccountData('0x33...')
// Deposit into Aave pool 0xcc...
await this.ethereum['MyWallet'].pool('0xcc...').lendDeposit('100')
// Borrow 100 amount from Aave pool 0xcc... with stable rate
await this.ethereum['MyWallet'].pool('0xcc...').lendBorrow('100', '1')
// Borrow 100 amount from Aave pool 0xcc... with dynamic rate
await this.ethereum['MyWallet'].pool('0xcc...').lendBorrow('100', '2')
// Withdraw 100 amount from Aave 0xcc...
await this.ethereum['MyWallet'].pool('0xcc...').lendWithdraw('100')
// Repay 100 amount into Aave pool 0xcc... with stable rate
await this.ethereum['MyWallet'].pool('0xcc...').lendRepay('100', '1')
// Repay 100 amount into Aave pool 0xcc... for dynamic rate
await this.ethereum['MyWallet'].pool('0xcc...').lendRepay('100', '2')
// access injected ABIs
await this.ethereum['MyWallet'].injectedABIs['MyContract']('0xcc...').balanceOf('0x33...')
```

### Indicators ###

Financial technical indicators can be accessed by this.indicators object. Implementation is done using [tulind](https://github.com/TulipCharts/tulipnode) indicators.

```javascript
// Simple Moving Average
this.indicators.sma(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Zero-Lag Exponential Moving Average
this.indicators.zlema(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Volume Weighted Moving Average
this.indicators.wma(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Williams %R
this.indicators.willr(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Weighted Close Price
this.indicators.wcprice(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Williams Accumulation/Distribution
this.indicators.wad(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Volume Weighted Moving Average
this.indicators.vwma(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Vertical Horizontal Filter
this.indicators.vhf(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Variance Over Period
this.indicators.var(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Ultimate Oscillator
this.indicators.ultosc(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Typical Price
this.indicators.typprice(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Time Series Forecast
this.indicators.tfs(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Trix
this.indicators.trix(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Triangular Moving Average
this.indicators.trima(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// True Range
this.indicators.tr(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Triple Exponential Moving Average
this.indicators.tema(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Sum Over Period
this.indicators.sum(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Stochastic RSI
this.indicators.stochrsi(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Stochastic Oscillator
this.indicators.stoch(this.data["BitmexLive"]["ETH/USD"], {kPeriod: 5, kSlowingPeriod: 3, dPeriod: 3}))
// Standard Error Over Period
this.indicators.stderr(this.data["BitmexLive"]["ETH/USD"], {period: 30})
// Standard Deviation Over Period
this.indicators.stddev(this.data["BitmexLive"]["ETH/USD"], {period: 30})
```

### BigNumber ###

Ethereum uses number bigger then supported by javascript so for much of them we need to use [BigNumber.js](https://mikemcl.github.io/bignumber.js/) library.

```javascript
// get balance from ethereum
const balance = await this.ethereum['MyWallet'].token('0xed...').getBalance('0x82...')
// load it to bignumber for operations over it
const bigNumberBalance = new BigNumber(balance.toString())
```

### Tensorflow ###

Tensorflow library in included with this.tf object. Check [website](https://www.tensorflow.org/js) for more details.

```javascript
const a = this.tf.tensor([[1, 2], [3, 4]]);
```

### Superagent ###

Https requests can be made with [superagent](https://github.com/visionmedia/superagent) library over this.superagent object.

```javascript
const requiredData = await this.superagent.get('https://where.is.my.pet/api/dog').query({search:'Woffy'})
```

# REST APIs #

All endpoints except signup and login require Authorization header with token which can be obtained with said endpoints.

* [Users](#users) (Users/sessions)
* [Exchanges](#exchanges)
* [Pairs](#pairs)
* [Wallets](#wallets)
* [Tokens](#tokens)
* [Pools](#pools)
* [Bots](#bots)
* [Trading](#trading)
* [Backtests](#backtests)

### Users ###

* GET /api/v1/me

    Get currently logged user

* POST /api/v1/me/signup

    Create new user

    ```javascript
    body:
        email
        password
        password2
    returns:
        status
        token
        user
    ```

* POST /api/v1/me/login

    Login with user

    ```javascript
    body:
        email
        password
    returns:
        status
        token
        user
    ```

### Exchanges ###

* GET /api/v1/exchanges/available

    Returns list of available exchanges

    ```javascript
    query:
        search
    returns:
        status
        exchanges
            id
            type
            exchange
            name
            supported
            functions
            url
            logo
            countries
        entries
    ```

* GET /api/v1/exchanges

    Get all connected exchanges for logged user

    ```javascript
    returns:
        status
        accounts
            id
            name
            key
            testnet
        entries
    ```

* POST /api/v1/exchanges/new

    Connect new exchange

    ```javascript
    body:
        name
        key
        secret
        testnet
        exchange
    returns:
        status
        id
    ```

* DELETE /api/v1/exchanges/:id

    Remove exchange connection

    ```javascript
    returns:
        status
    ```

* GET /api/v1/exchanges/:id

    Get exchange details

    ```javascript
    returns:
        status
        balances
        positions
        orders
        timeframes
        functions
        exchange
    ```

### Pairs ###

* GET /api/v1/pairs

    Get or search all pairs available to user

    ```javascript
    query:
        search
        limit
        offset
    returns:
        status
        pairs
            id
            pair
            cid
            base
            queote
            baseId
            quoteId
            spot
            account
                exhange
        entries
    ```

* GET /api/v1/pairs/:id

    Get pair details

    ```javascript
    query:
        timeframe
        start
        end
    returns:
        status
        pair
        data
        balances
        positions
        orders
        timeframes
        timeframe
    ```

* POST /api/v1/pairs/:id

    Create order on pair

    ```javascript
    body:
        type
        side
        price
        amount
    returns:
        status
    ```

### Wallets ###

* GET /api/v1/dexwallets

    Retrieve all wallets available to user

    ```javascript
    query:
        search
    returns:
        status
        dexwallets
            id
            name
            nodeurl
            walletindex
            address
        entries
    ```

* POST /api/v1/dexwallets

    Add new wallet

    ```javascript
    body:
        name
        nodeurl
        seedphrase
        walletindex
        txviewer
    returns:
        status
    ```    

* DELETE /api/v1/dexwallets/:id

    Deletes wallet

    ```javascript
    returns:
        status
    ```  

* GET /api/v1/dexwallets/:id

    Get wallet details

    ```javascript
    returns:
        status
        balance
        dexwallet
            id
            name
            nodeurl
            address
            walletindex
            txviewer
    ```   

* POST /api/v1/dexwallets/:id/transfer

    Transfer ether from wallet to address

    ```javascript
    body:
        address
        amount
    returns:
        status
        message
    ```   

### Tokens ###

* GET /api/v1/dextokens

    Get all available tokens

    ```javascript
    query:
        search
        limit
        offset
    returns:
        status
        tokens
        entries
    ```   

* GET /api/v1/dextokens/:id

    Get token details

    ```javascript
    query:
        search
        limit
        offset
    returns:
        status
        dextoken
            id
            symbol
            name
            decimals
        balances
            id
            name
            balance
    ```   

* POST /api/v1/dextokens/:id/transfer

    Tranfer token to address

    ```javascript
    body:
        wallet
        amount
        address
    returns:
        status
        message
    ```   

### Pools ###

* GET /api/v1/dexpools

    Get list of all pools available to user

    ```javascript
    query:
        search
        limit
        offset
    returns:
        status
        dexpools
            id
            volume
            txcount
            feetier
            token0
                id
                symbol
                name
                decimals
            token1
                id
                symbol
                name
                decimals
        entries
    ```

* GET /api/v1/dexpools/:id

    Get pool details

    ```javascript
    returns:
        status
        dexpool
            id
            volume
            txcount
            feetier
            token0
                id
                symbol
                name
                decimals
            token1
                id
                symbol
                name
                decimals
        wallets
            id
            name
            balance0
            balance1
    ```

* POST /api/v1/dexpools/:id/swap

    Swap token over pool

    ```javascript
    body:
        wallet
        amount
        direction
    returns:
        status
        message
    ```

* POST /api/v1/dexpools/:id/swapquote

    Get quote for swap token over pool

    ```javascript
    body:
        wallet
        amount
        direction
    returns:
        status
        amount
    ```

### Bots ###

* GET /api/v1/bots

    Get all user bots

    ```javascript
    query:
        search
    returns:
        status
        bots
        entries
    ```

* GET /api/v1/bots/:id

    Get bot details

    ```javascript
    returns:
        status
        bot
            id
            name
            code
    ```

* POST /api/v1/bots

    Create new bot

    ```javascript
    body:
        name
        code
    returns:
        status
        id
    ```

* POST /api/v1/bots/:id

    Update bot

    ```javascript
    body:
        name
        code
    returns:
        status
    ```

* DELETE /api/v1/bots/:id

    Delete bot

    ```javascript
    returns:
        status
    ```

### Trading ###

* GET /api/v1/tradings

    Get all trading sessions of user

    ```javascript
    query:
        search
        limit
        offset
        order
    returns:
        status
        tradings
            id
            name
            started
            ended
            reason
            code
        entries
    ```

* POST /api/v1/tradings/:id/stop

    Stop trading session

    ```javascript
    returns:
        status
    ```

* POST /api/v1/tradings/:id/restart

    Restart trading session
    
    ```javascript
    returns:
        status
    ```

* DELETE /api/v1/tradings/:id/delete

    Delete trading session

    ```javascript
    returns:
        status
    ```

* GET /api/v1/tradings/:id

    Get trading session of user

    ```javascript
    returns:
        status
        tradesession
            id
            name
            started
            ended
            reason
            code
        ohlcs
        logs
        trades
    ```

* POST /api/v1/tradings

    Start new trading session

    ```javascript
    body:
        id
        name
    returns:
        status
        id
    ```

### Backtests ###

* GET /api/v1/backtests

    Get backtesting sessions

    ```javascript
    query:
        search
        limit
        offset
        order
    returns:
        status
        backtests
            id
            name
            started
            ended
            reason
            code
        entries
    ```

* GET /api/v1/backtests/:id

    Get backtest details

    ```javascript
    query:
        search
        limit
        offset
        order
    returns:
        status
        backtest
            id
            name
            started
            ended
            reason
            code
        ohlcs
        logs
        trades
    ```

* POST /api/v1/backtests/:id/stop

    Stop backtest session

    ```javascript
    returns:
        status
    ```

* POST /api/v1/backtests/:id/restart

    Restart backtest session

    ```javascript
    returns:
        status
        id
    ```

* DELETE /api/v1/backtests/:id/delete

    Delete backtest session

    ```javascript
    returns:
        status
    ```

* POST /api/v1/backtests

    Start backtest

    ```javascript
    returns:
        status
        id
    ```