import React, { Component } from 'react'
import { Route, Switch, BrowserRouter, HashRouter } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Panel from './pages/Panel'
import DexWallets from './pages/DexWallets'
import DexWallet from './pages/DexWallet'
import DexTokens from './pages/DexTokens'
import DexToken from './pages/DexToken'
import DexSmartContracts from './pages/DexSmartContracts'
import DexSmartContract from './pages/DexSmartContract'
import Pair from './pages/Pair'
import Pairs from './pages/Pairs'
import Bot from './pages/Bot'
import Bots from './pages/Bots'
import Exchanges from './pages/Exchanges'
import Exchange from './pages/Exchange'
import Tradings from './pages/Tradings'
import Trading from './pages/Trading'
import Follows from './pages/Follows'
import Follow from './pages/Follow'
import Backtests from './pages/Backtests'
import Backtest from './pages/Backtest'
import Docs from './pages/Docs'
import Marketplace from './pages/Marketplace'
import MarketplaceItem from './pages/MarketplaceItem'
import MarketplaceAddItem from './pages/MarketplaceAddItem'
import Assets from './pages/Assets'

const routes = <Switch>
  <Route component={Landing} exact path="/" />
  <Route component={Login} path="/login" />
  <Route component={Register} path="/register" />
  <Route component={Panel} path="/panel" />
  <Route component={Pair} path="/pairs/:id" />
  <Route component={Pairs} path="/pairs" />
  <Route component={Bot} path="/bots/:id" />
  <Route component={Bots} path="/bots" />
  <Route component={Exchange} path="/exchanges/:id" />
  <Route component={Exchanges} path="/exchanges" />
  <Route component={DexWallet} path="/dexwallets/:id" />
  <Route component={DexWallets} path="/dexwallets" />
  <Route component={DexSmartContract} path="/dexsmartcontracts/:id" />
  <Route component={DexSmartContracts} path="/dexsmartcontracts" />
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
  <Route component={Follows} path="/follows" />
  <Route component={Follow} path="/follows/:id" />
  <Route component={Assets} path="/assets" />
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
