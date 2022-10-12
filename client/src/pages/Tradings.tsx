import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'

interface TestingsProps {
  history: any,
  location: any,
  match: any
}

type TestingsStates = {
  search: string
  tradings: any[]
  liveUpdates: any
}

class Tradings extends Component <TestingsProps, TestingsStates> {

  constructor (props: TestingsProps) {
    super(props)
    this.state = {
      search: '',
      tradings: [],
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.searchTradings()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    const interval = setInterval(()=>{ this.searchTradings() }, 1000)
    this.setState({liveUpdates: interval})
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as TestingsStates)
  }

  searchTradings = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings?search='+this.state.search+'&order=creatednewest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            tradings: json.tradings
          })
        } else {
          this.setState({
            tradings: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  stopTrading = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings/'+id+'/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchTradings()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  restartTrading = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings/'+id+'/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchTradings()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  deleteTrading = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings/'+id+'/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchTradings()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div className="Tradings">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Trading', path: '/tradings', active: true },
            ]}
            title={'Trading'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Trading</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchTradings}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Trading"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Started</th>
                    <th>Ended</th>
                    <th>Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.tradings.map((session:any) => {
                    return (
                      <tr key={session.id}>
                        <td><Link to={`/tradings/${session.id}`}>{session.name}</Link></td>
                        <td><Moment format="DD/MM/YYYY h:mm:ss A">{session.started}</Moment></td>
                        <td>{session.ended ? <Moment format="DD/MM/YYYY h:mm:ss A">{session.ended}</Moment> : null}</td>
                        <td>{session.reason}</td>
                        <td>
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Restart </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.restartTrading(session.id)}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Restart </Tooltip>}>
                              <span className="ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.stopTrading(session.id)}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.deleteTrading(session.id)}><i className="dripicons dripicons-trash"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                              <span className="ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-trash"></i></span>
                            </OverlayTrigger>
                          }
                        </td>
                      </tr>
                    )
                  })}
                  {this.state.tradings.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No trading sessions yet.</td></tr>
                  : null}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(Tradings);