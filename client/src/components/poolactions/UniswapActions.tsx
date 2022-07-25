import React, { Component } from 'react';
import { withRouter } from 'react-router'
import { Card, Table, DropdownButton, Dropdown } from 'react-bootstrap'
import { getCredentials } from '../../credcontrols'
import { config } from '../../config'
import { getDisplayBalance, fromDisplayBalance } from '../../utils'

interface UniswapActionsProps {
  history: any,
  location: any,
  match: any
  wallets: any[],
  dexpool: any
  loadDexPool: any
}

type UniswapActionsStates = {
  isLoading: boolean
  formLoading: boolean
  amount: string
  amountout: string
  wallet: string
  direction: number
  error: string
  success: string
}

class UniswapActions extends Component <UniswapActionsProps, UniswapActionsStates> {
  constructor (props: UniswapActionsProps) {
    super(props)
    this.state = {
      isLoading: false,
      formLoading: false,
      amount: '',
      amountout: '',
      wallet: this.props.wallets[0].id,
      direction: 0,
      error: '',
      success: ''
    }
  }

  inputChange = (event: any) => {
    const eventname = event.currentTarget.name
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as UniswapActionsStates, ()=>{
      if (eventname && this.state.amount && eventname === 'amount') {
        this.swapQuote()
      }
    })
  }

  componentDidMount () {
    
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
          this.props.loadDexPool()
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
          amount: fromDisplayBalance(this.state.amount, this.state.direction ? this.props.dexpool.data?.token1?.decimals : this.props.dexpool.data.token0?.decimals),
          wallet: this.state.wallet,
          direction: this.state.direction
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amountout: getDisplayBalance(json.amount, this.state.direction ? this.props.dexpool.data.token0?.decimals : this.props.dexpool.data.token1?.decimals)
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    const activeAccount = this.props.wallets.find(e => e.id === this.state.wallet)
    return (
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
                      {this.props.wallets.map(wallet => {
                        return <Dropdown.Item key={wallet.id} onClick={() => this.setState({wallet:wallet.id})}>{wallet.name}</Dropdown.Item>
                      })}
                    </DropdownButton>
                  </td>
                </tr>
                <tr>
                  <td className="text-end align-middle">Direction</td>
                  <td>
                    <DropdownButton
                      title={this.state.direction === 0 ? this.props.dexpool.data?.token0?.symbol+' to '+this.props.dexpool.data?.token1?.symbol : this.props.dexpool.data?.token1?.symbol+' to '+this.props.dexpool.data?.token0?.symbol}
                      size="sm"
                    >
                      <Dropdown.Item onClick={() => this.setState({direction:0}, ()=>{this.swapQuote()})}>{this.props.dexpool.data?.token0?.symbol} to {this.props.dexpool.data?.token1?.symbol}</Dropdown.Item>
                      <Dropdown.Item onClick={() => this.setState({direction:1}, ()=>{this.swapQuote()})}>{this.props.dexpool.data?.token1?.symbol} to {this.props.dexpool.data?.token0?.symbol}</Dropdown.Item>
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
    );
  }
}

export default withRouter(UniswapActions)