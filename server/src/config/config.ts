require("dotenv").config();

export const config:any = {
  app: {
    mode: process.env.MODE ? process.env.MODE : "FULL", // FULL, API, PROCESSOR
    concurrentTasks: process.env.CONCURRENT_TASKS ? process.env.CONCURRENT_TASKS : 5,
    port: process.env.PORT ? process.env.PORT : 4000,
    hostname: process.env.HOSTNAME ? process.env.HOSTNAME : 'localhost',
    sandbox_tf: process.env.SANDBOX_TF ? true : false,
    sandbox_superagent: process.env.SANDBOX_SUPERAGENT ? true : false,
    marketplaceAddress: process.env.MARKETPLACEADDRESS ? process.env.MARKETPLACEADDRESS : '0x532b2dBB81b3e29844dB717F855a33149A430C37',
    baseUri: process.env.REACT_APP_BASE_URI || 'http://localhost:4005'
  },
  db: process.env.MYSQL ? {
    host: process.env.MYSQL_HOST ? process.env.MYSQL_HOST : "localhost",
    username: process.env.MYSQL_USER ? process.env.MYSQL_USER : "root",
    password: process.env.MYSQL_PASS ? process.env.MYSQL_PASS : "1234",
    database: process.env.MYSQL_DB ? process.env.MYSQL_DB : "database",
    dialect: "mysql",
    logging: false,
    define: {
      charset: "utf8",
      collate: "utf8_general_ci"
    }
  } : undefined,
  redis: process.env.REDIS ? {
    host: process.env.REDIS_HOST ? process.env.REDIS_HOST : "localhost",
  } : undefined
}