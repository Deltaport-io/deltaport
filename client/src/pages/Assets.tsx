import React, { Component } from 'react';
import { Card, Table } from 'react-bootstrap'
import Dash from '../template/Dash'
import PageTitle from '../template/PageTitle'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { Link } from 'react-router-dom'
import { getDisplayBalance } from '../utils'

interface AssetsProps {
  history: any,
  location: any,
  match: any
}

type AssetsStates = {
  assets: any[]
  isLoading: boolean
}

class Assets extends Component <AssetsProps, AssetsStates> {

  constructor (props: AssetsProps) {
    super(props)
    this.state = {
      assets: [],
      isLoading: true
    }
  }

  componentDidMount () {
    this.loadAssets()
  }

  loadAssets = () => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/assets', {
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
            assets: json.assets,
            isLoading: false
          })
        }
      })
      .catch((error) => {
        console.log(error)
        this.setState({
          isLoading: false
        })
      })
  }

  render() {
    return (
      <div className="Assets">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Assets', path: '/assets', active: true },
            ]}
            title={'Assets'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Assets</h4>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Wallets</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.assets.filter(asset => asset.type === 'wallet').map((asset:any) => {
                    return (
                      <>
                        <tr key={asset.id}>
                          <td><Link to={`/dexwallets/${asset.id}`}>{asset.name}</Link></td>
                          <td></td>
                        </tr>
                        {asset.balances.map((item: any) => {
                          return (
                            <tr key={asset.id+'+'+item.id}>
                              <td style={{paddingLeft: 30}}>{item.symbol}</td>
                              <td>{getDisplayBalance(item.balance, item.decimals)}</td>
                            </tr>
                          )
                        })}
                      </>
                    )
                  })}
                  {this.state.assets.filter(asset => asset.type === 'wallet').length === 0 && this.state.isLoading === false ?
                    <tr><td colSpan={4} className="py-4 text-center">No wallets added.</td></tr>
                  : null}
                  {this.state.isLoading === true?
                    <tr><td colSpan={4} className="py-4 text-center">Loading...</td></tr>
                  : null}
                </tbody>
              </Table>
              <Table striped className="mb-0" size="sm" style={{marginTop: 15}}>
                <thead style={{marginTop: 10}}>
                  <tr>
                    <th>Exchanges</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.assets.filter(asset => asset.type === 'exchange').map((asset:any) => {
                    return (
                      <>
                        <tr key={asset.id}>
                          <td><Link to={`/exchanges/${asset.id}`}>{asset.name}</Link></td>
                          <td></td>
                        </tr>
                        {Object.keys(asset.balances).map((key: string) => {
                          const item = asset.balances[key]
                          return (
                            <tr key={asset.id+key}>
                              <td style={{paddingLeft: 30}}>{key}</td>
                              <td>{item.total}</td>
                            </tr>
                          )
                        })}
                      </>
                    )
                  })}
                  {this.state.assets.filter(asset => asset.type === 'exchange').length === 0 && this.state.isLoading === false ?
                    <tr><td colSpan={4} className="py-4 text-center">No connected exchanges.</td></tr>
                  : null}
                  {this.state.isLoading === true?
                    <tr><td colSpan={4} className="py-4 text-center">Loading...</td></tr>
                  : null}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default Assets;