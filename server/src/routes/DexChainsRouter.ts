import express from 'express'
import { getMeUser } from '../me'
import models from '../models'
import { validationResult } from 'express-validator'

export class DexChainsRouter {
  router: express.Router

  constructor () {
    this.router = express.Router()
  }

  getDexChainsInputs = [
  ]

  public async getDexChains (req: express.Request, res: express.Response) {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'Input validation failed.', errors: result.mapped() })
    }
    const user = await getMeUser(req.header('Authorization'))
    if (!user) {
      return res.send({ status: 'error', message: 'No user' })
    }
    const dexchains = await models.dexchains.findAll()
    return res.send({ status: 'success', dexchains })
  }

  init () {
    this.router.get('/', this.getDexChainsInputs, this.getDexChains)
  }
}

const dexchainsRouter = new DexChainsRouter()
dexchainsRouter.init()

export default dexchainsRouter.router