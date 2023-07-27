import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'

interface FollowsProps {
  history: any,
  location: any,
  match: any
}

type FollowsStates = {
  search: string
  follows: any[]
  liveUpdates: any
}

class Follows extends Component <FollowsProps, FollowsStates> {

  constructor (props: FollowsProps) {
    super(props)
    this.state = {
      search: '',
      follows: [],
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.searchFollows()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    const interval = setInterval(()=>{ this.searchFollows() }, 1000)
    this.setState({liveUpdates: interval})
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as FollowsStates)
  }

  searchFollows = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows?search='+this.state.search+'&order=creatednewest', {
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
            follows: json.follows
          })
        } else {
          this.setState({
            follows: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  stopFollow = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows/'+id+'/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchFollows()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  restartFollow = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows/'+id+'/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchFollows()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  deleteFollow = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows/'+id+'/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchFollows()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div className="Follows">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Follows', path: '/follows', active: true },
            ]}
            title={'Following'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Following</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={()=>this.searchFollows()}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Following"/>
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
                  {this.state.follows.map((session:any) => {
                    return (
                      <tr key={session.id}>
                        <td><Link to={`/follows/${session.id}`}>{session.name}</Link></td>
                        <td><Moment format="DD/MM/YYYY kk:mm:ss">{session.started}</Moment></td>
                        <td>{session.ended ? <Moment format="DD/MM/YYYY kk:mm:ss">{session.ended}</Moment> : null}</td>
                        <td>{session.reason}</td>
                        <td>
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Restart </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.restartFollow(session.id)}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Restart </Tooltip>}>
                              <span className="link-primary ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-play"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="link-primary ms-3" style={{color: '#ccc'}}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          :
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Stop </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.stopFollow(session.id)}><i className="dripicons dripicons-media-stop"></i></span>
                            </OverlayTrigger>
                          }
                          {session.ended ?
                            <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                              <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.deleteFollow(session.id)}><i className="dripicons dripicons-trash"></i></span>
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
                  {this.state.follows.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No follow sessions yet.</td></tr>
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

export default withRouter(Follows);