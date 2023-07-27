import { config } from "../config/config"
import sqlite3 from "sqlite3"
import exchanges from "./exchanges"
import pairs from "./pairs"
import tradesessions from "./tradesessions"
import tradelogs from "./tradelogs"
import tradeohlcs from "./tradeohlcs"
import backtestsessions from "./backtestsessions"
import backtestlogs from "./backtestlogs"
import backtestohlcs from "./backtestohlcs"
import sessions from "./sessions"
import users from "./users";
import passreset from "./passreset"
import bots from "./bots"
import accounts from "./accounts"
import dexchains from "./dexchains"
import usersdextokens from "./usersdextokens"
import dexes from "./dexes"
import dexwallets from "./dexwallets"
import dexsmartcontracts from "./dexsmartcontracts"
import dexsmartcontractsabis from "./dexsmartcontractsabis"
import dexsmartcontractstokens from "./dexsmartcontractstokens"
import dextokens from "./dextokens"
import tradegraphs from "./tradegraphs"
import backtestgraphs from "./backtestgraphs"
import followtrading from "./followtrading"
import subtradesessions from "./subtradesessions"

import isElectron from 'is-electron'

const Sequelize = require("sequelize")

let sequelize
if (config.db !== undefined) {
  sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    config.db
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlite3,
    storage: isElectron() ? require('electron').app.getPath('userData')+'/database.sqlite' : undefined,
    logging: false
  });
}

const models = {
  tradesessions: tradesessions(sequelize, Sequelize),
  tradelogs: tradelogs(sequelize, Sequelize),
  backtestsessions: backtestsessions(sequelize, Sequelize),
  backtestlogs: backtestlogs(sequelize, Sequelize),
  backtestohlcs: backtestohlcs(sequelize, Sequelize),
  sessions: sessions(sequelize, Sequelize),
  users: users(sequelize, Sequelize),
  usersdextokens: usersdextokens(sequelize, Sequelize),
  passreset: passreset(sequelize, Sequelize),
  exchanges: exchanges(sequelize, Sequelize),
  pairs: pairs(sequelize, Sequelize),
  bots: bots(sequelize, Sequelize),
  accounts: accounts(sequelize, Sequelize),
  tradeohlcs: tradeohlcs(sequelize, Sequelize),
  dexes: dexes(sequelize, Sequelize),
  dexchains: dexchains(sequelize, Sequelize),
  dexwallets: dexwallets(sequelize, Sequelize),
  dexsmartcontracts: dexsmartcontracts(sequelize, Sequelize),
  dexsmartcontractstokens: dexsmartcontractstokens(sequelize, Sequelize),
  dexsmartcontractsabis: dexsmartcontractsabis(sequelize, Sequelize),
  dextokens: dextokens(sequelize, Sequelize),
  tradegraphs: tradegraphs(sequelize, Sequelize),
  backtestgraphs: backtestgraphs(sequelize, Sequelize),
  followtrading: followtrading(sequelize, Sequelize),
  subtradesessions: subtradesessions(sequelize, Sequelize)
};

// associate
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

const db = {
  ...models,
  sequelize,
  Sequelize
};

export default db
