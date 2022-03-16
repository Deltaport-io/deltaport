import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import web3 from 'web3'

interface DexWalletProps {
  history: any,
  location: any,
  match: any
}

type DexWalletStates = {
  isLoading: boolean
  formLoading: boolean
  balance: string
  dexwallet: any
  address: string
  amount: string
  error: string
  success: string
}

class DexWallet extends Component <DexWalletProps, DexWalletStates> {
  constructor (props: DexWalletProps) {
    super(props)
    this.state = {
      isLoading: false,
      formLoading: false,
      balance: '0',
      dexwallet: {},
      address: '',
      amount: '',
      error: '',
      success: ''
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexWalletStates)
  }

  componentDidMount () {
    this.loadDexWallet()
  }

  loadDexWallet = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexwallets/'+id, {
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
            balance: json.balance,
            dexwallet: json.dexwallet
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
      config.app.apiUri + '/api/v1/dexwallets/'+id+'/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: web3.utils.toWei(this.state.amount, 'ether'),
          address: this.state.address
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
            address: '',
            error: '',
            success: json.message,
            formLoading: false
          })
          this.loadDexWallet()
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
    return (
      <div className="DexWallet">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Wallets', path: '/dexwallets' },
              { label: 'Wallet', path: '/dexwallets/'+id, active: true }
            ]}
            title={'Wallet'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.dexwallet.name}</h4>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Alias</td>
                    <td>{this.state.dexwallet.name}</td>
                  </tr>
                  <tr>
                    <td>Node Url</td>
                    <td>{this.state.dexwallet.nodeurl}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td className="font-monospace">{this.state.dexwallet.address}</td>
                  </tr>
                  <tr>
                    <td>Wallet index</td>
                    <td>{this.state.dexwallet.walletindex}</td>
                  </tr>
                  <tr>
                    <td>Tx viewer</td>
                    <td>{this.state.dexwallet.txviewer}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="row">
            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-2">Balance</h4> 
                  <Table striped className="mb-0" size="sm">
                    <thead>
                      <tr>
                        <th scope="col">Currency</th>
                        <th scope="col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ETH</td>
                        <td>{web3.utils.fromWei(this.state.balance, 'ether')}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-2">Transfer</h4>
                  <form onSubmit={this.sendToAddress}>
                    <Table className="mb-0 table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-end align-middle">Address</td>
                          <td><input type="text" value={this.state.address} name="address" className="form-control form-control-sm" placeholder="Address" required onChange={this.inputChange}/></td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Amount</td>
                          <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount in ETH" required onChange={this.inputChange}/></td>
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
                              <button className="btn btn-sm btn-primary" type="submit">Send</button>
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

export default withRouter(DexWallet)