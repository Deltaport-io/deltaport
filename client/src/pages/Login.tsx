import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { config } from '../config'
import { storeCredentials } from '../credcontrols'
import NonDash from '../template/NonDash'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom';

interface LoginProps {
  history: any,
  location: any,
  match: any
}

type LoginStates = {
  logError: string
  logErrors: any
  logEmail: string
  logPassword: string
};

class Login extends Component <LoginProps, LoginStates> {
  constructor (props: LoginProps) {
    super(props)
    this.state = {
      logError: '',
      logErrors: {},
      logEmail: '',
      logPassword: ''
    }
  }

  componentDidMount () {
    const ssid = new URLSearchParams(this.props.location.search).get('ssid')!
    if (ssid) {
      storeCredentials(ssid)
      this.props.history.push('/panel')
    }
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as LoginStates)
  }

  login = (event: any) => {
    event.preventDefault()
    fetch(
      config.app.apiUri + '/api/v1/me/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.state.logEmail,
          password: this.state.logPassword
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          storeCredentials(json.token)
          this.props.history.push('/panel')
        } else {
          this.setState({
            logErrors: json.errors,
            logError: json.message
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <NonDash>
        <main className="form-login">
          <form className="ps-3 pe-3" onSubmit={this.login}>
            <h1 className="h3 mb-3 fw-normal">Please login</h1>
            <div className="mb-2">
              <label className="form-label">Email</label>
              <input type="email" value={this.state.logEmail} name="logEmail" id="inputEmail" className="form-control" placeholder="Email address" required onChange={this.inputChange}/>
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" name="logPassword" value={this.state.logPassword} onChange={this.inputChange} type="password" placeholder="Your password"/>
            </div>
            { this.state.logError !== ''
              ? <div className="alert alert-danger alerterror">
                {this.state.logError}
              </div>
              : null
            }
            <div className="mb-3">
              <Button className="btn btn-primary w-100" type="submit">Login</Button>
            </div>
            <div className="text-center w-100">
              No account? <Link to={'/register'}>Register!</Link>
            </div>
          </form>
        </main>
      </NonDash>
    )
  }
}

export default withRouter(Login)