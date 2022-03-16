import express from 'express'
import { signMeUp, logMeIn, requestResetPassword, requestUpdatePassword } from '../me'
import { header, validationResult } from 'express-validator'
import { getMeUser } from '../me'

export class MeRouter {
  router: express.Router;

  /**
   * Initialize the MeRouter
   */
  constructor () {
    this.router = express.Router()
  }

  getMeInputs = [
    header('Authorization').notEmpty()
  ]

  public async getMe (req: express.Request, res: express.Response) {
    // validations
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return res.send({ status: 'error', message: 'You need to be logged in.' })
    }
    // process
    const user = await getMeUser(req.header('Authorization'))
    if (user !== false) {
      return res.send({
        status: 'success',
        data: {
          idusers: user.idusers,
          email: user.email,
          createdAt: user.createdAt
        }
      })
    } else {
      return res.send({ status: 'error', message: 'You need to be logged in.' })
    }
  }

  public signupUser (req: express.Request, res: express.Response) {
    const input: any = req.body
    if (input.email === undefined || input.password === undefined) {
      return res.send({ status: 'error', message: 'All fields are required.' })
    }
    if (input.password !== input.password2) {
      return res.send({ status: 'error', message: 'Passwords do not match.' })
    }
    const emailCheck = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line
    if (emailCheck.test(input.email) === false) {
      return res.send({ status: 'error', message: 'Enter proper email.' })
    }
    signMeUp(input.email, input.password).then((ret) => {
      return res.send(ret)
    })
  }

  public loginUser (req: express.Request, res: express.Response) {
    const input: any = req.body
    if (input.email === undefined || input.password === undefined) {
      return res.send({ status: 'error', message: 'All fields are required.' })
    }
    logMeIn(input.email, input.password).then((ret) => {
      return res.send(ret)
    })
  }

  public logoutUser (req: express.Request, res: express.Response) {
    return res.send({ me: 'logout' })
  }

  public resetPassword (req: express.Request, res: express.Response) {
    const input: any = req.body
    if (input.uid === undefined || input.password === undefined) {
      return res.send({ status: 'error', message: 'All fields are required.' })
    }
    requestUpdatePassword(input.uid, input.password).then((result) => {
      if (result === false) {
        return res.send({ status: 'error', message: 'Password reset failed.' })
      } else {
        return res.send({ status: 'success', message: 'Success! Please login.' })
      }
    })
  }

  public forgotPassword (req: express.Request, res: express.Response) {
    const input: any = req.body
    if (input.email === undefined) {
      return res.send({ status: 'error', message: 'All fields are required.' })
    }
    requestResetPassword(input.email).then((ret) => {
      return res.send({ status: 'success', message: 'Please check email' })
    })
  }

  /**
   * Take each handler, and attach to one of the Express.Router's
   * endpoints.
   */
  init () {
    this.router.get('/', this.getMeInputs, this.getMe)
    this.router.post('/signup', this.signupUser)
    this.router.post('/login', this.loginUser)
    this.router.post('/logout', this.logoutUser)
    this.router.post('/reset', this.resetPassword)
    this.router.post('/forgot', this.forgotPassword)
  }
}

// Create the MeRouter, and export its configured Express.Router
const meRoutes = new MeRouter()
meRoutes.init()

export default meRoutes.router
