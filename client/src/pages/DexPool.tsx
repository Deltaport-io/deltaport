import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { getDisplayBalance } from '../utils'
import AaveActions from '../components/poolactions/AaveActions'
import UniswapActions from '../components/poolactions/UniswapActions'
import { Info } from '../template/Info'

interface DexPoolProps {
  history: any,
  location: any,
  match: any
}

type DexPoolStates = {
  dexpool: any
  wallets: any[]
}

class DexPool extends Component <DexPoolProps, DexPoolStates> {
  constructor (props: DexPoolProps) {
    super(props)
    this.state = {
      dexpool: {},
      wallets: []
    }
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
              <h4 className="header-title mb-2">
                {this.state.dexpool.dextokens?.map((dextoken :any) => {
                  return (dextoken.symbol+' ')
                })}
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
                    <td className="font-monospace">{this.state.dexpool.id}</td>
                  </tr>
                  <tr>
                    <td>Tokens</td>
                    <td>
                      {this.state.dexpool.dextokens?.map((dextoken :any) => {
                        return <Link key={dextoken.id} to={`/dextokens/${dextoken.id}`}>{dextoken.symbol+' '}</Link>
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td>Data</td>
                    <td><Info data={this.state.dexpool.data}/></td>
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
                                    {this.state.dexpool.dextokens?.map((dextoken :any) => {
                                      return <tr key={dextoken.id}><td className="td-small">Balance {dextoken.symbol}:</td><td>{getDisplayBalance(wallet.balances[dextoken.symbol], dextoken.decimals)}</td></tr>
                                    })}
                                    {wallet.aave ?
                                      <>
                                        <tr>
                                          <td className="td-small">
                                            Total Collateral ETH:
                                          </td>
                                          <td>
                                            {getDisplayBalance(wallet.aave.totalCollateralETH, '18')}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="td-small">
                                            Total Debt ETH:
                                          </td>
                                          <td>
                                            {getDisplayBalance(wallet.aave.totalDebtETH, '18')}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="td-small">
                                            Avaliable Borrows ETH:
                                          </td>
                                          <td>
                                            {getDisplayBalance(wallet.aave.availableBorrowsETH, '18')}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="td-small">
                                            Liquidation Threshold:
                                          </td>
                                          <td>
                                            {wallet.aave.currentLiquidationThreshold}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="td-small">
                                            Loan to Value Ratio:
                                          </td>
                                          <td>
                                            {wallet.aave.ltv}
                                          </td>
                                        </tr>
                                      </>
                                    : null}
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
              {this.state.dexpool?.dex?.name! === 'Aave' ?
                <AaveActions dexpool={this.state.dexpool} wallets={this.state.wallets} loadDexPool={this.loadDexPool}/>
              :null}
              {this.state.dexpool?.dex?.name! === 'Uniswap' ?
                <UniswapActions dexpool={this.state.dexpool} wallets={this.state.wallets} loadDexPool={this.loadDexPool}/>
              :null}
            </div>
          </div>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexPool)