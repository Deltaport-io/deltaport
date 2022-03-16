import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'

interface BacktestsProps {
  history: any,
  location: any,
  match: any
}

type BacktestsStates = {
  search: string
  backtests: any[]
  liveUpdates: any
}

class Backtests extends Component <BacktestsProps, BacktestsStates> {

  constructor (props: BacktestsProps) {
    super(props)
    this.state = {
      search: '',
      backtests: [],
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.searchBacktests()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    const interval = setInterval(()=>{ this.searchBacktests() }, 1000)
    this.setState({liveUpdates: interval})
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as BacktestsStates)
  }

  searchBacktests = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests?search='+this.state.search+'&order=creatednewest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
        // creds
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            backtests: json.backtests
          })
        } else {
          this.setState({
            backtests: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  stopBacktest = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests/'+id+'/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchBacktests()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  rerunBacktest = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests/'+id+'/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchBacktests()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  deleteBacktest = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests/'+id+'/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchBacktests()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div className="Backtests">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Backtests', path: '/backtests', active: true },
            ]}
            title={'Backtests'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Backtests</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchBacktests}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Backtests"/>
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
                  {this.state.backtests.map((session:any) => {
                    return (
                      <tr key={session.id}>
                        <td><Link to={`/backtests/${session.id}`}>{session.name}</Link></td>
                        <td><Moment format="YYYY/MM/DD h:mm:ss A">{session.started}</Moment></td>
                        <td>{session.ended ? <Moment format="YYYY/MM/DD h:mm:ss A">{session.ended}</Moment> : null}</td>
                        <td>{session.reason}</td>
                        <td>
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Rerun </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.rerunBacktest(session.id)}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Rerun </Tooltip>}>
                              <span className="link-primary ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="link-primary ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.stopBacktest(session.id)}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.deleteBacktest(session.id)}><i className="dripicons dripicons-trash"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                              <span className="link-primary ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-trash"></i></span>
                            </OverlayTrigger>
                          }
                        </td>
                      </tr>
                    )
                  })}
                  {this.state.backtests.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No backtest sessions yet.</td></tr>
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

export default withRouter(Backtests);