import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { config } from '../config'
import NonDash from '../template/NonDash'
import { getCredentials, deleteCredentials } from '../credcontrols'

interface LandingProps {
  history: any,
  location: any,
  match: any
}

type LandingStates = {

}

class Landing extends Component <LandingProps, LandingStates> {

  interval: any

  constructor (props: LandingProps) {
    super(props)
    this.state = {}
  }

  componentDidMount () {
    this.interval = setInterval(()=>{ this.loadHealthcheck() }, 2500)
  }

  componentWillUnmount () {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  loadHealthcheck = () => {
    const { token } = getCredentials()
    if (token) {
      fetch(
        config.app.apiUri + '/api/v1/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          }
        })
        .then((response) => { return response.json() })
        .then((json) => {
          if (json.status === 'success') {
            this.props.history.push('/dashboard')
          }
          if (json.status === 'error') {
            deleteCredentials()
            this.props.history.push('/login')
          }
        })
        .catch((error) => {
          console.log(error)
        })
    } else {
      fetch(
        config.app.apiUri + '/api/v1/healthcheck', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((response) => { return response.json() })
        .then((json) => {
          if (json.status === 'success') {
            if (this.interval) {
              clearInterval(this.interval)
            }
            this.props.history.push('/login')
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
  
  render(){
    return (
      <NonDash>
        <div className="d-flex justify-content-center mb-3">
          <div className="spinner-border spinner-border-lg text-primary">
            <span className="sr-only"></span>
          </div>
        </div>
        <div className="d-flex justify-content-center">
          Loading, please wait!
        </div>
      </NonDash>
    )
  }
}

export default withRouter(Landing)