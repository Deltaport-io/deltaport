import React, { Component } from 'react'
import { withRouter } from 'react-router'
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import Moment from 'react-moment'
import { Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'

interface BotsProps {
  history: any,
  location: any,
  match: any
}

type BotsStates = {
  search: string
  bots: any[]
}

class Bots extends Component <BotsProps, BotsStates> {
  constructor (props: BotsProps) {
    super(props)
    this.state = {
      search: '',
      bots: []
    }
  }

  componentDidMount () {
    this.searchBots()
  }

  loadBot = (id: string) => {
    this.props.history.push('/bots/'+id)
  } 

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as BotsStates)
  }

  searchBots (event: any = null) {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      `${config.app.apiUri}/api/v1/bots?search=${this.state.search}&order=creatednewest`, {
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
            bots: json.bots
          })
        } else {
          // this.setState({error: json.message})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  deleteBot = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/bots/'+id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.searchBots()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render(){
    return (
      <div className="Bots">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Bots', path: '/bots', active: true },
            ]}
            title={'Bots'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Bots</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchBots}>
                  <div className="input-group input-group-sm me-2">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Bots"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
                <button onClick={()=>this.loadBot('new')} type="button" className="btn btn-primary btn-sm">New bot</button>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.bots.map((bot:any) => {
                    return (
                      <tr key={bot.id}>
                        <td><Link to={`/bots/${bot.id}`}>{bot.name}</Link></td>
                        <td><Moment format="DD/MM/YYYY kk:mm:ss">{bot.createdAt}</Moment></td>
                        <td><Moment format="DD/MM/YYYY kk:mm:ss">{bot.updatedAt}</Moment></td>
                        <td>
                          <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                            <span className="link-primary ms-3" style={{cursor: 'pointer'}} onClick={()=>this.deleteBot(bot.id)}><i className="dripicons dripicons-trash"></i></span>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    )
                  })}
                  {this.state.bots.length === 0 ?
                    <tr><td colSpan={4} className="py-4 text-center">No bots, create new one first.</td></tr>
                  : null}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Dash>
      </div>
    ) 
  }
}

export default withRouter(Bots)