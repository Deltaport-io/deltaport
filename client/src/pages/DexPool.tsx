import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table, DropdownButton, Dropdown } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { getDisplayBalance, fromDisplayBalance } from '../utils'

interface DexPoolProps {
  history: any,
  location: any,
  match: any
}

type DexPoolStates = {
  isLoading: boolean
  formLoading: boolean
  dexpool: any
  wallets: any[]
  amount: string
  amountout: string
  wallet: string
  direction: number
  error: string
  success: string
}

class DexPool extends Component <DexPoolProps, DexPoolStates> {
  constructor (props: DexPoolProps) {
    super(props)
    this.state = {
      isLoading: false,
      formLoading: false,
      dexpool: {},
      wallets: [],
      amount: '',
      amountout: '',
      wallet: '',
      direction: 0,
      error: '',
      success: ''
    }
  }

  inputChange = (event: any) => {
    const eventname = event.currentTarget.name
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexPoolStates, ()=>{
      if (eventname && this.state.amount && eventname === 'amount') {
        this.swapQuote()
      }
    })
  }

  componentDidMount () {
    this.loadDexPool()
  }

  loadDexPool = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id, {
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
            dexpool: json.dexpool,
            wallets: json.wallets,
            wallet: json.wallets[0]?.id
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  swapToken = (event: any) => {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          wallet: this.state.wallet,
          direction: this.state.direction
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
            amountout: '',
            direction: 0,
            success: json.message,
            formLoading: false
          })
          this.loadDexPool()
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

  swapQuote = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/swapquote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: fromDisplayBalance(this.state.amount, this.state.direction ? this.state.dexpool.token1?.decimals : this.state.dexpool.token0?.decimals),
          wallet: this.state.wallet,
          direction: this.state.direction
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amountout: getDisplayBalance(json.amount, this.state.direction ? this.state.dexpool.token0?.decimals : this.state.dexpool.token1?.decimals)
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    const { id } = this.props.match.params
    const activeAccount = this.state.wallets.find(e => e.id === this.state.wallet)
    return (
      <div className="DexPool">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Pools', path: '/dexpools' },
              { label: 'Pool', path: '/dexpools/'+id, active: true }
            ]}
            title={'Pool'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.dexpool.token0?.symbol} / {this.state.dexpool.token1?.symbol}</h4>
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
                    <td className="font-monospace">{this.state.dexpool.id}</td>
                  </tr>
                  <tr>
                    <td>Token0</td>
                    <td><Link to={`/dextokens/${this.state.dexpool.token0?.id}`}>{this.state.dexpool.token0?.symbol}</Link></td>
                  </tr>
                  <tr>
                    <td>Token1</td>
                    <td><Link to={`/dextokens/${this.state.dexpool.token1?.id}`}>{this.state.dexpool.token1?.symbol}</Link></td>
                  </tr>
                  <tr>
                    <td>Fee</td>
                    <td>{this.state.dexpool.feetier / 10000}%</td>
                  </tr>
                  <tr>
                    <td>Tx count</td>
                    <td>{this.state.dexpool.txcount}</td>
                  </tr>
                  <tr>
                    <td>Dex</td>
                    <td>{this.state.dexpool.dex?.name}</td>
                  </tr>
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
                        <th>{this.state.dexpool.token0?.symbol}</th>
                        <th>{this.state.dexpool.token1?.symbol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.wallets.map((balance:any) => {
                        return (
                          <tr key={balance.id}>
                            <td><Link to={`/dexwallets/${balance.id}`}>{balance.name}</Link></td>
                            <td>{getDisplayBalance(balance[this.state.dexpool.token0?.symbol], this.state.dexpool.token0?.decimals)}</td>
                            <td>{getDisplayBalance(balance[this.state.dexpool.token1?.symbol], this.state.dexpool.token1?.decimals)}</td>
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
                  <h4 className="header-title mb-3">Swap</h4> 
                  <form onSubmit={this.swapToken}>
                    <Table className="mb-0 table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-end align-middle">Wallet</td>
                          <td>
                            <DropdownButton
                              title={activeAccount ? activeAccount.name : ''}
                              size="sm"
                            >
                              {this.state.wallets.map(wallet => {
                                return <Dropdown.Item key={wallet.id} onClick={() => this.setState({wallet:wallet.id})}>{wallet.name}</Dropdown.Item>
                              })}
                            </DropdownButton>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Direction</td>
                          <td>
                            <DropdownButton
                              title={this.state.direction === 0 ? this.state.dexpool.token0?.symbol+' to '+this.state.dexpool.token1?.symbol : this.state.dexpool.token1?.symbol+' to '+this.state.dexpool.token0?.symbol}
                              size="sm"
                            >
                              <Dropdown.Item onClick={() => this.setState({direction:0}, ()=>{this.swapQuote()})}>{this.state.dexpool.token0?.symbol} to {this.state.dexpool.token1?.symbol}</Dropdown.Item>
                              <Dropdown.Item onClick={() => this.setState({direction:1}, ()=>{this.swapQuote()})}>{this.state.dexpool.token1?.symbol} to {this.state.dexpool.token0?.symbol}</Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Amount in</td>
                          <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Approx out</td>
                          <td><input type="text" value={this.state.amountout} name="amountout" className="form-control form-control-sm" placeholder="Amount out" disabled/></td>
                        </tr>
                        <tr>
                          <td></td>
                          <td>
                            { this.state.formLoading ?
                              <button className="btn btn-sm btn-primary" type="button">
                                <div className="spinner-border spinner-border-sm">
                                  <span className="sr-only"></span>
                                </div>
                              </button>
                            :
                              <button className="btn btn-sm btn-primary" type="submit">Swap</button>
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

export default withRouter(DexPool)