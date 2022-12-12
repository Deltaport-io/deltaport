import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table, Nav, DropdownButton, Dropdown } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { getDisplayBalance } from '../utils'
import AaveActions from '../components/poolactions/AaveActions'
import UniswapActions from '../components/poolactions/UniswapActions'
import { Info } from '../template/Info'

interface DexSmartContractProps {
  history: any,
  location: any,
  match: any
}

type DexSmartContractStates = {
  dexsmartcontract: any
  wallets: any[],
  inputObj: any,
  inputAction: any
  error: string
  success: string
  formLoading: boolean
}

class DexSmartContract extends Component <DexSmartContractProps, DexSmartContractStates> {
  constructor (props: DexSmartContractProps) {
    super(props)
    this.state = {
      dexsmartcontract: {},
      wallets: [],
      inputObj: {},
      inputAction: '',
      error: '',
      success: '',
      formLoading: false
    }
  }

  componentDidMount () {
    this.loadDexSmartcontract()
  }

  loadDexSmartcontract = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexsmartcontracts/'+id, {
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
            dexsmartcontract: json.dexsmartcontract,
            wallets: json.wallets
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
      <div className="DexSmartcontracts">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Smartcontracts', path: '/dexsmartcontracts' },
              { label: 'Smartcontract', path: '/dexsmartcontracts/'+id, active: true }
            ]}
            title={'SmartContract'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">
                Title
              </h4>
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
                    <td className="font-monospace">{this.state.dexsmartcontract.id}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td className="font-monospace">{this.state.dexsmartcontract.address}</td>
                  </tr>
                  <tr>
                    <td>Description</td>
                    <td className="font-monospace">{this.state.dexsmartcontract.description}</td>
                  </tr>
                  <tr>
                    <td>Data</td>
                    <td><Info data={this.state.dexsmartcontract.data}/></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <div className="row">
            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-2">Wallets</h4>
                  <Table striped className="mb-0" size="xs">
                    <tbody>
                      {this.state.wallets.map((wallet:any) => {
                        return (
                          <tr key={wallet.id}>
                            <td>
                              <div style={{padding: 8, fontWeight: 'bold'}}><Link to={`/dexwallets/${wallet.id}`}>{wallet.name}</Link></div>
                              <div style={{paddingLeft: 16}}>
                                <table>
                                  <tbody>
                                    {this.state.dexsmartcontract.data.view.ui.map((entry: any) => {
                                      return (
                                        <tr key={entry.name}>
                                          <td>{entry.name}</td>
                                          <td>{getDisplayBalance(wallet.data[entry.value], entry.decimals)}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
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
                  { this.state.dexsmartcontract.data && this.state.dexsmartcontract.data.actions && this.state.dexsmartcontract.data.actions.length > 1 ?
                    <>
                      <h4 className="header-title mb-3">Actions</h4>
                      <Nav
                        as="ul"
                        variant="pills"
                        className="nav nav-pills bg-nav-pills nav-justified mb-3"
                        activeKey={this.state.inputAction}
                        onSelect={(selectedKey) => this.setState({inputAction: selectedKey!, inputObj: {}, error: '', success: '', formLoading: false})}
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
                    </>
                  :null}
                  { this.state.dexsmartcontract.data && this.state.dexsmartcontract.data.actions && this.state.dexsmartcontract.data.actions.length === 1 ?
                    <h4 className="header-title mb-3">{this.state.dexsmartcontract.data.actions[0].title}</h4>
                  :null}
                  {this.state.dexsmartcontract.data ? this.state.dexsmartcontract.data.actions['swap'].ui.map((entry: any) => {
                    return (
                      entry.type === 'walletSelect' ? 
                        <input placeholder='wallet select'/>
                      : entry.type === 'select' ?
                        <input placeholder='select'/>
                      : entry.type === 'balanceInput' ?
                        <input placeholder='balance input'/>
                      : entry.type === 'balanceInput' ?
                        <input placeholder='balance input'/>
                      : null
                    )
                  }) : null}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexSmartContract)