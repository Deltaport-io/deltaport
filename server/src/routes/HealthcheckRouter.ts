import express from 'express'

export class HealthcheckRouter {
  router: express.Router;

  constructor () {
    this.router = express.Router()
  }

  public async get (req: express.Request, res: express.Response) {
    return res.send({ status: 'success' })
  }

  init () {
    this.router.get('/', this.get)
  }
}

const healthcheckRoutes = new HealthcheckRouter()
healthcheckRoutes.init()

export default healthcheckRoutes.router
