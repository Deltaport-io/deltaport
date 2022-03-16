import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Modal, Button, Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Link } from "react-router-dom";
import PageTitle from '../template/PageTitle'
import { getPromotedExchanges } from '../utils'

interface ExchangesProps {
  history: any,
  location: any,
  match: any
}

type ExchangesStates = {
  isLoading: boolean
  type: string
  name: string
  exchange: string
  key: string
  secret: string
  testnet: boolean
  accounts: any[]
  exchanges: any[]
  error: string
  errors: any
  showModal: any
  search: string
}

class Exchanges extends Component <ExchangesProps, ExchangesStates> {
  constructor (props: ExchangesProps) {
    super(props)
    this.state = {
      isLoading: false,
      type: '',
      name: '',
      exchange: '',
      key: '',
      secret: '',
      testnet: false,
      accounts: [],
      exchanges: [],
      error: '',
      errors: {},
      showModal: {name: '', id: ''},
      search: ''
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as ExchangesStates)
  }

  checkboxChange = (event: any) => {
    this.setState({testnet: !this.state.testnet} as ExchangesStates)
  }

  componentDidMount () {
    if(this.props.location.search){
      const search = new URLSearchParams(this.props.location.search).get('search')!
      this.setState({
        search
      }, () => {
        this.loadAccounts()
        this.loadExchanges()
      })
    } else {
      this.loadAccounts()
      this.loadExchanges()
    }
  }

  loadAccounts = () => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/exchanges/', {
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
            accounts: json.accounts
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  searchExchanges = (event: any) => {
    event.preventDefault()
    this.loadExchanges()
  }

  loadExchanges = () => {
    const { token } = getCredentials()
    const query = this.state.search !== '' ? '?search='+this.state.search : ''
    fetch(
      config.app.apiUri + '/api/v1/exchanges/available'+query, {
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
            exchanges: json.exchanges
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  save = () => {
    this.setState({isLoading:true})
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/exchanges/new', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          exchange: this.state.showModal.id,
          key: this.state.key,
          secret: this.state.secret,
          testnet: this.state.testnet,
          name: this.state.name
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            isLoading: false,
            exchange: '',
            key: '',
            secret: '',
            name: '',
            error: '',
            showModal: {name: '', id: ''}
          })
          this.loadAccounts()
        } else {
          console.log(json)
          this.setState({
            isLoading: false,
            error: json.message.error.message
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  remove = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/exchanges/'+id, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.loadAccounts()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  openModal = (name: string, id: string) => {
    this.setState({
      error: '',
      showModal: {name, id}
    })
  }

  closeModal = () => {
    this.setState({
      showModal: {name: '', id: ''}
    })
  }

  render() {
    const promoted = getPromotedExchanges()
    return (
      <div className="Exchanges">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Exchanges', path: '/exchanges', active: true },
            ]}
            title={'Exchanges'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Connected</h4>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col">Alias</th>
                    <th scope="col">Broker</th>
                    <th scope="col">Key</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.accounts.map((account:any) => {
                    return (
                      <tr key={account.name}>
                        <td><Link to={`/exchanges/${account.id}`}>{account.name}</Link></td>
                        <td>{account.exchange.name}</td>
                        <td>{account.key.substring(0, 3)}xxxxxxxxxxxxx</td>
                        <td>
                          <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                            <span className="link-primary ms-2" style={{cursor: 'pointer'}} onClick={()=>this.remove(account.id)}><i className="dripicons dripicons-trash"></i></span>
                          </OverlayTrigger>  
                        </td>
                      </tr>
                    );
                  })}
                  {this.state.accounts.length === 0 ?
                    <tr><td colSpan={4} className="py-4 text-center">No connected exchanges yet.</td></tr>
                  : null}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Available</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchExchanges}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Exchange name"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Broker</th>
                    <th scope="col">Country</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.exchanges.filter((e:any) => promoted.includes(e.name)).map((exchange:any) => {
                    return (
                      <tr key={exchange.id}>
                        <td><i className="mdi mdi-star text-warning"></i></td>
                        <td><a target="_blank" rel="noreferrer" href={exchange.url}>{exchange.name} <i className="uil uil-external-link-alt"></i></a></td>
                        <td>{typeof exchange.countries === 'string' ? JSON.parse(exchange.countries).toString() : exchange.countries.toString() }</td>
                        <td>
                          <OverlayTrigger placement="bottom" overlay={<Tooltip> Connect exchange </Tooltip>}>
                            <span className="link-primary" style={{cursor: 'pointer'}} onClick={()=>this.openModal(exchange.name, exchange.id)}><i className="uil uil-cloud-data-connection"></i></span>
                          </OverlayTrigger> 
                        </td>
                      </tr>
                    )
                  })}
                  {this.state.exchanges.map((exchange:any) => {
                    return (
                      <tr key={exchange.id}>
                        <td>{promoted.includes(exchange.name) ? <i className="mdi mdi-star text-warning"></i> : null}</td>
                        <td><a target="_blank" rel="noreferrer" href={exchange.url}>{exchange.name} <i className="uil uil-external-link-alt"></i></a></td>
                        <td>{typeof exchange.countries === 'string' ? JSON.parse(exchange.countries).toString() : exchange.countries.toString() }</td>
                        <td>
                          <OverlayTrigger placement="bottom" overlay={<Tooltip> Connect exchange </Tooltip>}>
                            <span className="link-primary" style={{cursor: 'pointer'}} onClick={()=>this.openModal(exchange.name, exchange.id)}><i className="uil uil-cloud-data-connection"></i></span>
                          </OverlayTrigger> 
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Dash>

        <Modal show={this.state.showModal.name !== ''} onHide={this.closeModal} animation={false} centered>
          <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Modal.Title>Connect {this.state.showModal.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="ps-3 pe-3">
              <div className="mb-3">
                <label className="form-label">Alias</label>
                <input className="form-control form-control-sm" name="name" value={this.state.name} onChange={this.inputChange} type="text" placeholder="Alias"/>
              </div>
              <div className="mb-3">
                <label className="form-label">Exchange API Key</label>
                <input className="form-control form-control-sm" name="key" value={this.state.key} onChange={this.inputChange} type="text" placeholder="Key"/>
              </div>
              <div className="mb-3">
                <label className="form-label">Exchange API Secret</label>
                <input className="form-control form-control-sm" name="secret" value={this.state.secret} onChange={this.inputChange} type="text" placeholder="Secret"/>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input type="checkbox" name="testnet" checked={this.state.testnet} onChange={this.checkboxChange} className="form-check-input"/>
                  <label className="form-check-label">Paper-trading / demo account</label>
                </div>
              </div>
              { this.state.error !== ''
                ? <div className="alert alert-danger alerterror">
                  {this.state.error}
                </div>
                : null
              }
            </form>
            { this.state.isLoading ?
              <div className="mb-1 text-center">
                <Button className="btn btn-primary account-button" type="button">
                  <div className="spinner-border spinner-border-sm">
                    <span className="sr-only"></span>
                  </div>
                </Button>
              </div>
            :
              <div className="mb-1 text-center">
                <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.save()}>Connect</Button>
              </div>
            }
          </Modal.Body>
        </Modal>

      </div>
    );
  }
}

export default withRouter(Exchanges)