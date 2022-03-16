import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { config } from '../config'
import { storeCredentials } from '../credcontrols'
import NonDash from '../template/NonDash'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom';

interface RegisterProps {
  history: any,
  location: any,
  match: any
}

type RegisterStates = {
  logError: string
  logErrors: any
  logEmail: string
  logPassword: string
  logPassword2: string
};

class Register extends Component <RegisterProps, RegisterStates> {
  constructor (props: RegisterProps) {
    super(props)
    this.state = {
      logError: '',
      logErrors: {},
      logEmail: '',
      logPassword: '',
      logPassword2: ''
    }
  }

  componentDidMount () {

  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as RegisterStates)
  }

  register = (event: any) => {
    event.preventDefault()
    fetch(
      config.app.apiUri + '/api/v1/me/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.state.logEmail,
          password: this.state.logPassword,
          password2: this.state.logPassword2
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          storeCredentials(json.token)
          this.props.history.push('/dashboard')
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
        <main className="form-register">
          <form className="ps-3 pe-3" onSubmit={this.register}>
            <h1 className="h3 mb-3 fw-normal">Register here</h1>
            <div className="mb-2">
              <label className="form-label">Email</label>
              <input type="email" value={this.state.logEmail} name="logEmail" id="inputEmail" className="form-control" placeholder="Email address" required onChange={this.inputChange}/>
            </div>
            <div className="mb-2">
              <label className="form-label">Password</label>
              <input className="form-control" name="logPassword" value={this.state.logPassword} onChange={this.inputChange} type="password" placeholder="Your password"/>
            </div>
            <div className="mb-3">
              <label className="form-label">Re-Password</label>
              <input className="form-control" name="logPassword2" value={this.state.logPassword2} onChange={this.inputChange} type="password" placeholder="Repeat password"/>
            </div>
            { this.state.logError !== ''
              ? <div className="alert alert-danger alerterror">
                {this.state.logError}
              </div>
              : null
            }
            <div className="mb-3">
              <Button className="btn btn-primary w-100" type="submit">Register</Button>
            </div>
            <div className="text-center w-100">
              Have account? <Link to={'/login'}>Login!</Link>
            </div>
          </form>
        </main>
      </NonDash>
    );
  }
}

export default withRouter(Register)