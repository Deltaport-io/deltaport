// load config
import { config } from "./config/config"

// imports
import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import { taskQueue } from "./taskqueue"
import models from './models'
import { Umzug, SequelizeStorage } from 'umzug';
import { loadExchanges, importIfNotInPoolsTokens } from './loaders'

// routes
import MeRouter from "./routes/MeRouter"
import BotsRouter from "./routes/BotsRouter"
import PairsRouter from "./routes/PairsRouter"
import ExchangesRouter from "./routes/ExchangesRouter"
import DexWalletsRouter from "./routes/DexWalletsRouter"
import BacktestsRouter from "./routes/BacktestsRouter"
import TradingsRouter from "./routes/TradingsRouter"
import DexPoolsRouter from "./routes/DexPoolsRouter"
import DexTokensRouter from "./routes/DexTokensRouter"
import DexSmartContractsRouter from "./routes/DexSmartContractsRouter"
import HealthcheckRouter from "./routes/HealthcheckRouter"
import MarketplaceRouter from "./routes/MarketplaceRouter"
import FollowRouter from "./routes/FollowRouter"
import AssetsRouter from "./routes/AssetsRouter"

import {
  logger,
  expressLogger,
  expressErrorLogger
} from './logger'

export const start = async () => {
  logger.info('starting up...')

  // sync db if empty
  await models.sequelize.sync()

  // run migrations if any
  const umzug = new Umzug({
    migrations: { glob: './migrations/*.ts' },
    context: models.sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: models.sequelize }),
    logger: logger,
  });
  await umzug.up();

  // run loaders
  try {
    await loadExchanges()
    await importIfNotInPoolsTokens()
  } catch (e) {
    logger.error('failed loading', e)
  }
  
  if (config.app.mode === 'FULL' || config.app.mode === 'API') {
    // https express server
    const app = express()
    // middleware
    app.use((req, res, next) => {
      // headers
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
      next()
    })
    app.use(express.json())
    app.use(compression())
    app.use(helmet())
    // logger
    app.use(expressLogger)
    // routes
    app.use('/api/v1/me', MeRouter)
    app.use('/api/v1/bots', BotsRouter)
    app.use('/api/v1/pairs', PairsRouter)
    app.use('/api/v1/exchanges', ExchangesRouter)
    app.use('/api/v1/dexwallets', DexWalletsRouter)
    app.use('/api/v1/dexpools', DexPoolsRouter)
    app.use('/api/v1/dextokens', DexTokensRouter)
    app.use('/api/v1/dexsmartcontracts', DexSmartContractsRouter)
    app.use('/api/v1/backtests', BacktestsRouter)
    app.use('/api/v1/tradings', TradingsRouter)
    app.use('/api/v1/healthcheck', HealthcheckRouter)
    app.use('/api/v1/marketplace', MarketplaceRouter)
    app.use('/api/v1/follows', FollowRouter)
    app.use('/api/v1/assets', AssetsRouter)
    // error logger
    app.use(expressErrorLogger)
    // listen
    app.listen(config.app.port, config.app.hostname)
  }
  if (config.app.mode === 'FULL' || config.app.mode === 'PROCESSOR') {
    // start process
    taskQueue.processTasks()
    // handle close
    process.on('SIGTERM', async () => {
      logger.info('closing active jobs...')
      await delay(10000)
      process.exit(0)
    })
    process.on('SIGINT', async () => {
      logger.info('closing active jobs...')
      await delay(10000)
      process.exit(0)
    })
  }
}

const delay = (ms) => {
  return new Promise((resolve)=>{return setTimeout(resolve, ms)})
}

start()
