import React, { Component } from 'react'
import { Route, Switch, BrowserRouter, HashRouter } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DexWallets from './pages/DexWallets'
import DexWallet from './pages/DexWallet'
import DexPools from './pages/DexPools'
import DexPool from './pages/DexPool'
import DexTokens from './pages/DexTokens'
import DexToken from './pages/DexToken'
import Pair from './pages/Pair'
import Pairs from './pages/Pairs'
import Bot from './pages/Bot'
import Bots from './pages/Bots'
import Exchanges from './pages/Exchanges'
import Exchange from './pages/Exchange'
import Tradings from './pages/Tradings'
import Trading from './pages/Trading'
import Backtests from './pages/Backtests'
import Backtest from './pages/Backtest'
import Docs from './pages/Docs'
import Marketplace from './pages/Marketplace'
import MarketplaceItem from './pages/MarketplaceItem'
import MarketplaceAddItem from './pages/MarketplaceAddItem'

const routes = <Switch>
  <Route component={Landing} exact path="/" />
  <Route component={Login} path="/login" />
  <Route component={Register} path="/register" />
  <Route component={Dashboard} path="/dashboard" />
  <Route component={Pair} path="/pairs/:id" />
  <Route component={Pairs} path="/pairs" />
  <Route component={Bot} path="/bots/:id" />
  <Route component={Bots} path="/bots" />
  <Route component={Exchange} path="/exchanges/:id" />
  <Route component={Exchanges} path="/exchanges" />
  <Route component={DexWallet} path="/dexwallets/:id" />
  <Route component={DexWallets} path="/dexwallets" />
  <Route component={DexPool} path="/dexpools/:id" />
  <Route component={DexPools} path="/dexpools" />
  <Route component={DexToken} path="/dextokens/:id" />
  <Route component={DexTokens} path="/dextokens" />
  <Route component={Trading} path="/tradings/:id" />
  <Route component={Tradings} path="/tradings" />
  <Route component={Backtest} path="/backtests/:id" />
  <Route component={Backtests} path="/backtests" />
  <Route component={Docs} path="/docs" />
  <Route component={MarketplaceAddItem} path="/marketplace/add" />
  <Route component={MarketplaceItem} path="/marketplace/:id" />
  <Route component={Marketplace} path="/marketplace" />
</Switch>

class Router extends Component {
  render () {
    return (
        // electron uses hashrouter
        window.location.pathname.includes('index.html') ? 
          <HashRouter>
            {routes}
          </HashRouter>
        :
          <BrowserRouter>
            {routes}
          </BrowserRouter>
    )
  }
}

export default Router
