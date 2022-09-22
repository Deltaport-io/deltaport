import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { Button, Card, Table, Modal, DropdownButton, Dropdown } from 'react-bootstrap'
import AceEditor from "react-ace";
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'
import { fromDisplayBalance, getDisplayBalance } from '../utils'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { CandlestickChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  ToolboxComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  DatasetComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

// include required
echarts.use(
  [
    TitleComponent,
    TooltipComponent,
    GridComponent,
    CandlestickChart,
    LineChart,
    CanvasRenderer,
    BarChart,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent,
    DatasetComponent
  ]
);

interface MarketplaceItemProps {
  history: any,
  location: any,
  match: any
}

type MarketplaceItemStates = {
  item: any
  wallets: any[]
  selectedWallet: any
  data: any
  graphs: any
  graphKeys: any
  logs: any[]
  viewGraphs: boolean
  viewCode: boolean
  viewLogs: boolean
  showPurchaseModal: boolean
  showSubscribeModal: boolean
  showUnsubscribeModal: boolean
  showTopoffModal: boolean
  error: string
  message: string
  isLoading: boolean
  amount: string
  subscribeModalAmount: string
}

const style = getComputedStyle(document.body)
const colors = [
  style.getPropertyValue('--bs-primary'),
  style.getPropertyValue('--bs-danger'),
  style.getPropertyValue('--bs-success'),
  style.getPropertyValue('--bs-warning'),
  style.getPropertyValue('--bs-info')
]

class MarketplaceItem extends Component <MarketplaceItemProps, MarketplaceItemStates> {

  constructor (props: MarketplaceItemProps) {
    super(props)
    this.state = {
      item: {},
      wallets: [],
      selectedWallet: undefined,
      data: {},
      graphs: {},
      graphKeys: {},
      logs: [],
      viewGraphs: true,
      viewCode: true,
      viewLogs: true,
      showPurchaseModal: false,
      showSubscribeModal: false,
      showUnsubscribeModal: false,
      showTopoffModal: false,
      error: '',
      message: '',
      isLoading: false,
      amount: '0',
      subscribeModalAmount: '0'
    }
  }

  componentDidMount () {
    this.loadMarketItem()
    this.loadDexWallets()
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as MarketplaceItemStates)
  }

  loadMarketItem = () => {
    const { id } = this.props.match.params;
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+id, {
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
            item: json.item
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  loadDexWallets = () => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexwallets/', {
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
            wallets: json.dexwallets,
            selectedWallet: json.dexwallets[0]
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  showPurchaseModal = () => {
    this.setState({showPurchaseModal: true})
  }

  showSubscribe = () => {
    this.setState({showSubscribeModal: true})
  }

  showUnsubscribe = () => {
    this.setState({showUnsubscribeModal: true})
  }

  purchaseItem = () => {
    this.setState({isLoading: true, error: ''})
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+this.state.item.blockchainId+'/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          blockchainId: this.state.item.blockchainId,
          price: this.state.item.price,
          wallet: this.state.selectedWallet.id
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({isLoading: false, message: json.message})
        } else {
          this.setState({isLoading: false, error: json.message})
        }
      })
      .catch((error) => {
        this.setState({isLoading: false, error})
      })
  }

  subscribeItem = () => {
    this.setState({isLoading: true, error: ''})
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+this.state.item.blockchainId+'/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          blockchainId: this.state.item.blockchainId,
          price: fromDisplayBalance(this.state.subscribeModalAmount, '18'),
          wallet: this.state.selectedWallet.id
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({isLoading: false, message: json.message})
        } else {
          this.setState({isLoading: false, error: json.message})
        }
      })
      .catch((error) => {
        this.setState({isLoading: false, error})
      })
  }

  unsubscribeItem = () => {
    this.setState({isLoading: true, error: ''})
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+this.state.item.id+'/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          blockchainId: this.state.item.blockchainId,
          // TODO: wallet that purchased address
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({isLoading: false, message: json.message})
        } else {
          this.setState({isLoading: false, error: json.message})
        }
      })
      .catch((error) => {
        this.setState({isLoading: false, error})
      })
  }

  closeItem = () => {
    this.setState({isLoading: true, error: ''})
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+this.state.item.blockchainId+'/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          blockchainId: this.state.item.blockchainId,
          // TODO: wallet with item.owner address
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({isLoading: false, message: json.message})
        } else {
          this.setState({isLoading: false, error: json.message})
        }
      })
      .catch((error) => {
        this.setState({isLoading: false, error})
      })
  }

  render () {
    const { id } = this.props.match.params
    const subWallet = this.state.item && this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].subscriber ?  this.state.item.blockInfo[0].subscriber : null
    const wallet = this.state.wallets.find(x => x.address === subWallet)
    return (
      <div className="MarketItem">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Marketplace', path: '/marketplace' },
              { label: 'Item', path: '/marketplace/'+id, active: true }
            ]}
            title={'Item'}
          />
          {this.state.item && this.state.item.title ?
            <Card>
              <Card.Body>
                <h4 className="header-title mb-2">{this.state.item.title}</h4>
                <Table striped className="mb-0" size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Title</td>
                      <td>{this.state.item.title}</td>
                    </tr>
                    <tr>
                      <td>Type</td>
                      <td>{this.state.item.type}</td>
                    </tr>
                    <tr>
                      <td>Added</td>
                      <td><Moment format="DD/MM/YYYY h:mm:ss A">{this.state.item.added}</Moment></td>
                    </tr>
                    <tr>
                      <td>Owner</td>
                      <td><Link to={`/marketplace?search=owner:${this.state.item.owner}`}>{this.state.item.owner}</Link></td>
                    </tr>
                    <tr>
                      <td>Description</td>
                      <td>{this.state.item.description}</td>
                    </tr>
                    {this.state.item.price?
                      <tr>
                        <td>Price</td>
                        <td>{getDisplayBalance(this.state.item.price,'18')}</td>
                      </tr>
                    :null}
                    {this.state.item.blockInfo && this.state.item.blockInfo.length > 0 && this.state.item.blockchainType === "1" ?
                      <tr>
                        <td>Subscription balance</td>
                        <td>{getDisplayBalance(this.state.item.blockInfo[0].amount, '18')}</td>
                      </tr>
                    :null}
                    {this.state.item.blockInfo && this.state.item.blockInfo.length > 0 && this.state.item.blockchainType === "1"?
                      <tr>
                        <td>Next deduction on</td>
                        <td><Moment format="DD/MM/YYYY" unix>{this.state.item.blockInfo[0].endSub}</Moment></td>
                      </tr>
                    :null}
                    <tr>
                      <td>Actions</td>
                      <td>
                        <div className="mb-2 me-1">
                          {this.state.wallets.map(x => x.address).includes(this.state.item.owner) ?
                            <button onClick={()=>this.setState({})} type="button" className="btn btn-sm btn-primary">Close</button>
                          :
                            <div>
                              {this.state.item.blockchainType === "0" ?
                                <button onClick={()=>this.showPurchaseModal()} type="button" className="btn btn-sm btn-primary">Purchase</button>
                              :null}
                              {this.state.item.blockchainType === "1" ?
                                <>
                                  <button onClick={()=>this.showSubscribe()} type="button" className="btn btn-sm btn-primary">Subscribe/TopOff</button>
                                  {this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].amount ?
                                    <button onClick={()=>this.showUnsubscribe()} type="button" className="btn btn-sm btn-primary">Unsubscribe</button>
                                  :null}
                                </>
                              :null}
                            </div>
                          }
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          :null}

          {this.state.item && this.state.item.data ?
            <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block">Data</h4>
                {this.state.item.blockchainType === "0" || this.state.item.blockchainType === "1" ?
                  <div style={{height: 'calc(100vh - 335px)',position:'relative'}}>
                    <AceEditor
                      mode="javascript"
                      theme="github"
                      height="100%"
                      width="100%"
                      value={this.state.item.data} 
                    />
                  </div>
                :null}
                {this.state.item.blockchainType === "2" ?
                  <div>
                    Subscribe system
                  </div>
                :null}
                {this.state.item.blockchainType === "3" ?
                  <div>
                    {this.state.item.data}
                  </div>
                :null}
              </Card.Body>
            </Card>
          : null}

          {this.state.item && this.state.item.code ?
            <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block">Code</h4>
                <div style={{height: 'calc(100vh - 335px)',position:'relative'}}>
                  <AceEditor
                    mode="javascript"
                    theme="github"
                    height="100%"
                    width="100%"
                    value={this.state.item.code} 
                  />
                </div>
              </Card.Body>
            </Card>
          : null}

          {this.state.logs && this.state.logs.length > 0 ?
            <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block">Logs</h4>
                <Table striped className="mb-0" size="sm">
                  <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Log</th>
                  </tr>
                  </thead>
                  <tbody>
                    {this.state.logs.map((log:any) => {
                      return (
                        <tr key={log.id}>
                          <td><Moment format="DD/MM/YYYY h:mm:ss A">{log.timestamp}</Moment></td>
                          <td>{log.type}</td>
                          <td>{log.msg}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          : null}

          <Modal show={this.state.showPurchaseModal} onHide={()=>this.setState({showPurchaseModal: false})} animation={false} centered>
            <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Modal.Title>Purchase</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form className="ps-3 pe-3">
                <div className="mb-3">
                  <label className="form-label">Amount</label>
                  <div>{getDisplayBalance(this.state.item.price,'18')}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Wallet</label>
                  <DropdownButton
                    title={ this.state.selectedWallet ? this.state.selectedWallet.name : 'Select wallet' }
                  >
                    { this.state.wallets.map((wallet:any, index: number) => {
                      return <Dropdown.Item key={wallet.id} onClick={() => this.setState({selectedWallet: wallet})}>{wallet.name}</Dropdown.Item>
                    })}
                  </DropdownButton>
                </div>
                { this.state.error !== ''
                  ? <div className="alert alert-danger alerterror">
                    {this.state.error}
                  </div>
                  : null
                }
                { this.state.message !== ''
                  ? <div className="alert alert-success mb-0">
                    Success <a target="_blank" rel="noreferrer" href={ this.state.message }>Tx details <i className="uil uil-external-link-alt"></i></a>
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
                  <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.purchaseItem()}>Purchase</Button>
                </div>
              }
            </Modal.Body>
          </Modal>

          <Modal show={this.state.showSubscribeModal} onHide={()=>this.setState({showSubscribeModal: false})} animation={false} centered>
            <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Modal.Title>Subscribe / TopOff</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form className="ps-3 pe-3">
                <div className="mb-3">
                  <label className="form-label">Subscribe/TopOff with</label>
                  <input type="text" value={this.state.subscribeModalAmount} name="subscribeModalAmount" className="form-control form-control-sm" placeholder="Amount in ETH" required onChange={this.inputChange}/>
                </div>
                <div className="mb-3">
                  <label className="form-label">Wallet</label>
                  {wallet ?
                    <div>{wallet.name}</div>
                  :
                    <DropdownButton
                      title={ this.state.selectedWallet ? this.state.selectedWallet.name : 'Select wallet' }
                    >
                      { this.state.wallets.map((wallet:any, index: number) => {
                        return <Dropdown.Item key={wallet.id} onClick={() => this.setState({selectedWallet: wallet})}>{wallet.name}</Dropdown.Item>
                      })}
                    </DropdownButton>
                  }
                </div>
                { this.state.error !== ''
                  ? <div className="alert alert-danger alerterror">
                    {this.state.error}
                  </div>
                  : null
                }
                { this.state.message !== ''
                  ? <div className="alert alert-success mb-0">
                    Success <a target="_blank" rel="noreferrer" href={ this.state.message }>Tx details <i className="uil uil-external-link-alt"></i></a>
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
                  <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.subscribeItem()}>Subscribe/TopOff</Button>
                </div>
              }
            </Modal.Body>
          </Modal>

          <Modal show={this.state.showUnsubscribeModal} onHide={()=>this.setState({showUnsubscribeModal: false})} animation={false} centered>
            <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Modal.Title>Subscribe</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form className="ps-3 pe-3">
                {this.state.item && this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].amount?
                  <div className="mb-3">
                    <label className="form-label">Amount</label>
                    <div>{getDisplayBalance(this.state.item.blockInfo[0].amount, '18')}</div>
                  </div>
                :null}
                <div className="mb-3">
                  <label className="form-label">Wallet</label>
                  {wallet ?
                    <div>{wallet.name}</div>
                  :
                    <DropdownButton
                      title={ this.state.selectedWallet ? this.state.selectedWallet.name : 'Select wallet' }
                    >
                      { this.state.wallets.map((wallet:any, index: number) => {
                        return <Dropdown.Item key={wallet.id} onClick={() => this.setState({selectedWallet: wallet})}>{wallet.name}</Dropdown.Item>
                      })}
                    </DropdownButton>
                  }
                </div>
                { this.state.error !== ''
                  ? <div className="alert alert-danger alerterror">
                    {this.state.error}
                  </div>
                  : null
                }
                { this.state.message !== ''
                  ? <div className="alert alert-success mb-0">
                    Success <a target="_blank" rel="noreferrer" href={ this.state.message }>Tx details <i className="uil uil-external-link-alt"></i></a>
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
                  <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.unsubscribeItem()}>Unsubscribe</Button>
                </div>
              }
            </Modal.Body>
          </Modal>

        </Dash>
      </div>
    );
  }
}

export default MarketplaceItem;