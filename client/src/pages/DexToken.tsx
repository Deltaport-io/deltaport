import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table, DropdownButton, Dropdown } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { getDisplayBalance, fromDisplayBalance } from '../utils'

interface DexTokenProps {
  history: any,
  location: any,
  match: any
}

type DexTokenStates = {
  isLoading: boolean
  formLoading: boolean
  dextoken: any
  balances: any[]
  address: string
  amount: string
  wallet: string
  error: string
  success: string
}

class DexToken extends Component <DexTokenProps, DexTokenStates> {
  constructor (props: DexTokenProps) {
    super(props)
    this.state = {
      isLoading: false,
      formLoading: false,
      dextoken: {},
      balances: [],
      address: '',
      amount: '',
      wallet: '',
      error: '',
      success: ''
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexTokenStates)
  }

  componentDidMount () {
    this.loadDexToken()
  }

  loadDexToken = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dextokens/'+id, {
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
            dextoken: json.dextoken,
            balances: json.balances,
            wallet: json.balances[0]?.id
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  sendToAddress = (event: any) => {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dextokens/'+id+'/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: fromDisplayBalance(this.state.amount, this.state.dextoken.decimals),
          address: this.state.address,
          wallet: this.state.wallet
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
            address: '',
            success: json.message,
            formLoading: false
          })
          this.loadDexToken()
        } else {
          this.setState({
            error: json.message,
            formLoading: false
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    const { id } = this.props.match.params
    const activeWallet = this.state.balances.find(e => e.id === this.state.wallet)
    return (
      <div className="DexToken">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Tokens', path: '/dextokens' },
              { label: 'Token', path: '/dextokens/'+id, active: true }
            ]}
            title={'Token'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.dextoken.symbol}</h4>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Id</td>
                    <td className="font-monospace">{this.state.dextoken.id}</td>
                  </tr>
                  <tr>
                    <td>Symbol</td>
                    <td>{this.state.dextoken.symbol}</td>
                  </tr>
                  <tr>
                    <td>Name</td>
                    <td>{this.state.dextoken.name}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Top pools - <Link to={`/dexpools?search=${this.state.dextoken.symbol}`}>See all</Link></h4> 
              <Table striped hover className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Pairs</th>
                    <th>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.dextoken.token0?.map((pools:any) => {
                    return <tr key={pools.id}>
                      <td className="font-monospace"><Link to={`/dexpools/${pools.id}`}>{pools.id}</Link></td>
                      <td>{pools.token0.symbol} / {pools.token1.symbol}</td>
                      <td>{pools.feetier / 10000}%</td>
                    </tr>
                  })}
                  {this.state.dextoken.token1?.map((pools:any) => {
                    return <tr key={pools.id}>
                      <td className="font-monospace"><Link to={`/dexpools/${pools.id}`}>{pools.id}</Link></td>
                      <td>{pools.token0.symbol} / {pools.token1.symbol}</td>
                      <td>{pools.feetier / 10000}%</td>
                    </tr>
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="row">
            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-2">Balances</h4> 
                  <Table striped className="mb-0" size="sm">
                    <thead>
                      <tr>
                        <th>Wallet</th>
                        <th>{this.state.dextoken.symbol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.balances.map((balance:any) => {
                        return (
                          <tr key={balance.id}>
                            <td><Link to={`/dexwallets/${balance.id}`}>{balance.name}</Link></td>
                            <td>{getDisplayBalance(balance.balance, this.state.dextoken.decimals)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-3">Transfer</h4> 
                  <form onSubmit={this.sendToAddress}>
                    <Table className="mb-0 table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-end align-middle">Wallet</td>
                          <td>
                            <DropdownButton
                              title={activeWallet ? activeWallet.name : ''}
                              size="sm"
                            >
                              {this.state.balances.map(wallet => {
                                return <Dropdown.Item onClick={() => this.setState({wallet:wallet.id})}>{wallet.name}</Dropdown.Item>
                              })}
                            </DropdownButton>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Address</td>
                          <td><input type="text" value={this.state.address} name="address" className="form-control form-control-sm" placeholder="Address" required onChange={this.inputChange}/></td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Amount</td>
                          <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
                        </tr>
                        <tr>
                          <td></td>
                          <td>
                            { this.state.formLoading ?
                              <button className="btn btn-primary btn-sm" type="button">
                                <div className="spinner-border spinner-border-sm">
                                  <span className="sr-only"></span>
                                </div>
                              </button>
                              
                            :
                              <button className="btn btn-primary btn-sm" type="submit">Send</button>
                            }
                          </td>
                        </tr>
                        { this.state.success !== '' || this.state.error !== '' ?
                          <tr>
                            <td></td>
                            <td>
                              { this.state.success !== ''
                                ? <div className="alert alert-success mb-0">
                                  Success <a target="_blank" rel="noreferrer" href={ this.state.success }>Tx details <i className="uil uil-external-link-alt"></i></a>
                                </div>
                                : null
                              }
                              { this.state.error !== ''
                                ? <div className="alert alert-danger mb-0">
                                  {this.state.error}
                                </div>
                                : null
                              }
                            </td>
                          </tr>
                        : null }
                      </tbody>
                    </Table>

                  </form>
                </Card.Body>
              </Card>
            </div>
          </div>

        </Dash>
      </div>
    );
  }
}

export default withRouter(DexToken)