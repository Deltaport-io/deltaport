import React, { Component } from 'react';
import { withRouter } from 'react-router'
import { Card, Nav, Table, DropdownButton, Dropdown } from 'react-bootstrap'
import { getCredentials } from '../../credcontrols'
import { config } from '../../config'

const interestRateModes: any = {
  '0': 'Stable',
  '1': 'Variable'
}

interface AaveActionsProps {
  history: any,
  location: any,
  match: any
  wallets: any[],
  dexpool: any
  loadDexPool: any
}

type AaveActionsStates = {
  action: string
  isLoading: boolean
  formLoading: boolean
  amount: string
  interestMode: string
  wallet: string
  error: string
  success: string
}

class AaveActions extends Component <AaveActionsProps, AaveActionsStates> {
  constructor (props: AaveActionsProps) {
    super(props)
    this.state = {
      action: 'borrow',
      isLoading: false,
      formLoading: false,
      amount: '',
      interestMode: '0',
      wallet: this.props.wallets[0] && this.props.wallets[0].id ? this.props.wallets[0].id : '',
      error: '',
      success: ''
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as AaveActionsStates)
  }

  componentDidMount () {
    
  }

  borrowToken (event: any) {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/lendborrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          wallet: this.state.wallet,
          interestMode: this.state.interestMode
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
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

  depositToken (event: any) {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/lenddeposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          wallet: this.state.wallet
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
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

  withdrawToken (event: any) {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/lendwithdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          wallet: this.state.wallet
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
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

  repayToken (event: any) {
    event.preventDefault()
    this.setState({error: '', success: '', formLoading: true})
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexpools/'+id+'/lendrepay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          wallet: this.state.wallet,
          interestMode: this.state.interestMode
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            amount: '',
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


  render() {
    const activeAccount = this.props.wallets.find(e => e.id === this.state.wallet)
    return (
      <Card>
        <Card.Body>
          <h4 className="header-title mb-3">Actions</h4>
          <Nav
            as="ul"
            variant="pills"
            className="nav nav-pills bg-nav-pills nav-justified mb-3"
            activeKey={this.state.action}
            onSelect={(selectedKey) => this.setState({action: selectedKey!, amount: '', error: '', success: '', formLoading: false})}
          >
            <Nav.Item as="li" className="nav-item">
              <Nav.Link href="#" eventKey="borrow" className="nav-link rounded-0">
                <span className="d-none d-lg-block">Borrow</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item as="li" className="nav-item">
              <Nav.Link href="#" eventKey="deposit" className="nav-link rounded-0">
                <span className="d-none d-lg-block">Deposit</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item as="li">
              <Nav.Link href="#" eventKey="withdraw" className="nav-link rounded-0">
                <span className="d-none d-lg-block">Withdraw</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item as="li">
              <Nav.Link href="#" eventKey="repay" className="nav-link rounded-0">
                <span className="d-none d-lg-block">Repay</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>

          { this.state.action === 'borrow' ?
            <form onSubmit={(e)=>this.borrowToken(e)}>
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
                    <td className="text-end align-middle">Amount</td>
                    <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
                  </tr>
                  <tr>
                    <td className="text-end align-middle">Interest mode</td>
                    <td>
                      <DropdownButton
                        title={interestRateModes[this.state.interestMode]}
                        size="sm"
                      >
                        {Object.keys(interestRateModes).map(modeKey => {
                          return <Dropdown.Item key={modeKey} onClick={() => this.setState({interestMode:modeKey})}>{interestRateModes[modeKey]}</Dropdown.Item>
                        })}
                      </DropdownButton>
                    </td>
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
                        <button className="btn btn-sm btn-primary" type="submit">Borrow</button>
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
          :null}

          { this.state.action === 'deposit' ?
            <form onSubmit={(e)=>this.depositToken(e)}>
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
                    <td className="text-end align-middle">Amount</td>
                    <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
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
                        <button className="btn btn-sm btn-primary" type="submit">Deposit</button>
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
          :null}

          { this.state.action === 'withdraw' ?
            <form onSubmit={(e)=>this.withdrawToken(e)}>
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
                    <td className="text-end align-middle">Amount</td>
                    <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
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
                        <button className="btn btn-sm btn-primary" type="submit">Withdraw</button>
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
          :null}

          { this.state.action === 'repay' ?
            <form onSubmit={(e)=>this.repayToken(e)}>
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
                    <td className="text-end align-middle">Amount</td>
                    <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
                  </tr>
                  <tr>
                    <td className="text-end align-middle">Interest mode</td>
                    <td>
                      <DropdownButton
                        title={interestRateModes[this.state.interestMode]}
                        size="sm"
                      >
                        {Object.keys(interestRateModes).map(modeKey => {
                          return <Dropdown.Item key={modeKey} onClick={() => this.setState({interestMode:modeKey})}>{interestRateModes[modeKey]}</Dropdown.Item>
                        })}
                      </DropdownButton>
                    </td>
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
                        <button className="btn btn-sm btn-primary" type="submit">Repay</button>
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
          :null}

        </Card.Body>
      </Card>
    );
  }
}

export default withRouter(AaveActions)