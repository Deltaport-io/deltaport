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

interface DexSmartContractProps {
  history: any,
  location: any,
  match: any
}

type DexSmartContractStates = {
  dexsmartcontract: any
  wallets: any[]
}

class DexSmartContract extends Component <DexSmartContractProps, DexSmartContractStates> {
  constructor (props: DexSmartContractProps) {
    super(props)
    this.state = {
      dexsmartcontract: {},
      wallets: []
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
                      
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>
            { /*
            <div className="col-md-6">
              {this.state.dexpool?.dex?.name! === 'Aave' ?
                <AaveActions dexpool={this.state.dexpool} wallets={this.state.wallets} loadDexPool={this.loadDexPool}/>
              :null}
              {this.state.dexpool?.dex?.name! === 'Uniswap' ?
                <UniswapActions dexpool={this.state.dexpool} wallets={this.state.wallets} loadDexPool={this.loadDexPool}/>
              :null}
            </div>
            */ }
          </div>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexSmartContract)