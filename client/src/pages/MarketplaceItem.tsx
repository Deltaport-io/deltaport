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

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

interface MarketplaceItemProps {
  history: any
  location: any
  match: any
}

type MarketplaceItemStates = {
  item: any
  wallets: any[]
  accounts: any[]
  selectedWallet: any
  data: any
  showPurchaseModal: boolean
  showSubscribeModal: boolean
  showUnsubscribeModal: boolean
  showTopoffModal: boolean
  showSetupFollowModal: boolean
  error: string
  message: string
  isLoading: boolean
  amount: string
  subscribeModalAmount: string
  createFollowName: string
  createFollowMapping: any
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
      accounts: [],
      selectedWallet: undefined,
      data: {},
      showPurchaseModal: false,
      showSubscribeModal: false,
      showUnsubscribeModal: false,
      showTopoffModal: false,
      showSetupFollowModal: false,
      error: '',
      message: '',
      isLoading: false,
      amount: '0',
      subscribeModalAmount: '0',
      createFollowName: '',
      createFollowMapping: {}
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

  loadAccounts = () => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/exchanges/', {
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
            accounts: json.accounts
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  showPurchaseModal = () => {
    this.loadDexWallets()
    this.setState({showPurchaseModal: true})
  }

  showSubscribe = () => {
    this.loadDexWallets()
    this.setState({showSubscribeModal: true})
  }

  showUnsubscribe = () => {
    this.setState({showUnsubscribeModal: true})
  }

  showFollowSetupModal = () => {
    this.loadDexWallets()
    this.loadAccounts()
    this.setState({showSetupFollowModal: true})
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
    const subWallet = this.state.item && this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].subscriber ?  this.state.item.blockInfo[0].subscriber : null
    const wallet = this.state.wallets.find(x => x.address === subWallet)
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
          wallet: wallet.id
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
    const subWallet = this.state.item && this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].subscriber ?  this.state.item.blockInfo[0].subscriber : null
    const wallet = this.state.wallets.find(x => x.address === subWallet)
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/marketplace/'+this.state.item.id+'/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          blockchainId: this.state.item.blockchainId,
          wallet: wallet.id
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

  setupFollow = () => {
    this.setState({isLoading: true, error: ''})
    // process mapping
    const subWallet = this.state.item && this.state.item.blockInfo && this.state.item.blockInfo[0] && this.state.item.blockInfo[0].subscriber ?  this.state.item.blockInfo[0].subscriber : null
    const wallet = this.state.wallets.find(x => x.address === subWallet)
    const mapping: any = {}
    if (this.state.createFollowMapping && this.state.createFollowMapping.ethereum) {
      for (const index in this.state.createFollowMapping.ethereum) {
        if (mapping['ethereum'] === undefined) {
          mapping['ethereum'] = {}
        }
        mapping['ethereum'][index] = this.state.createFollowMapping.ethereum[index].id
      }
    }
    if (this.state.createFollowMapping && this.state.createFollowMapping.exchanges) {
      for (const index in this.state.createFollowMapping.exchanges) {
        if (mapping['exchanges'] === undefined) {
          mapping['exchanges'] = {}
        }
        mapping['exchanges'][index] = this.state.createFollowMapping.exchanges[index].id
      } 
    }
    // post to backend
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          name: this.state.createFollowName,
          remoteId: this.state.item.id,
          mapping,
          wallet: wallet.id
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.props.history.push('/follows')
          this.setState({isLoading: false})
        } else {
          this.setState({isLoading: false, error: json.message})
        }
      })
      .catch((error) => {
        this.setState({isLoading: false, error})
      })
  }

  addToMapping = (network: string, index: number, data: any) => {
    const createFollowMapping = this.state.createFollowMapping
    if (createFollowMapping[network] === undefined) {
      createFollowMapping[network] = {}
    }
    if (createFollowMapping[network][index] === undefined) {
      createFollowMapping[network][index] = data
    }
    if (data === undefined) {
      delete createFollowMapping[network][index]
    }
    this.setState({createFollowMapping})
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
                      <td><Moment format="DD/MM/YYYY kk:mm:ss">{this.state.item.createdAt}</Moment></td>
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
                                    <span>
                                      <button onClick={()=>this.showUnsubscribe()} type="button" className="btn btn-sm btn-primary">Unsubscribe</button>
                                      <button onClick={()=>this.showFollowSetupModal()} type="button" className="btn btn-sm btn-primary">Setup Follow</button>
                                    </span>
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

          {this.state.item && this.state.item.data && this.state.item.data.code && this.state.item.blockchainType === "0" ?
            <Card>
              <Card.Body>
                <div>
                  <h4 className="header-title d-inline-block">Data</h4>
                  <div style={{height: 'calc(100vh - 335px)',position:'relative'}}>
                    <AceEditor
                      mode="javascript"
                      theme="github"
                      height="100%"
                      width="100%"
                      value={this.state.item.data.code} 
                    />
                  </div>
                </div>
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

          <Modal show={this.state.showSetupFollowModal} onHide={()=>this.setState({showSetupFollowModal: false})} animation={false} centered>
            <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Modal.Title>Setup Following</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form className="ps-3 pe-3">
                <div className="mb-3">
                  <label className="form-label">Name the following</label>
                  <input type="text" value={this.state.createFollowName} name="createFollowName" className="form-control form-control-sm" placeholder="Alias" required onChange={this.inputChange}/>
                </div>
                {this.state.item.data && this.state.item.data.ethereum && this.state.item.data.ethereum.length > 0 ?
                  <div>
                    <div>Ethereum wallets</div>
                    {this.state.item.data.ethereum.map((e: any)=>{
                      return <div>
                        <div className="mb-3">
                          <label className="form-label">Select: {e.index} - wallet</label>
                          {this.state.createFollowMapping &&
                            this.state.createFollowMapping.ethereum &&
                            this.state.createFollowMapping.ethereum[e.index] ?
                            <div onClick={()=>this.addToMapping('ethereum', e.index, undefined)}>{this.state.createFollowMapping.ethereum[e.index].name}</div>
                          :
                            <DropdownButton
                              title={''}
                            >
                              { this.state.wallets.map((wallet:any, index: number) => {
                                return <Dropdown.Item key={wallet.id} onClick={()=>this.addToMapping('ethereum', e.index, wallet)}>{wallet.name}</Dropdown.Item>
                              })}
                            </DropdownButton>
                          }
                        </div>
                      </div>
                    })}
                  </div>
                : null}
                {this.state.item.data && this.state.item.data.exchanges && this.state.item.data.exchanges.length > 0 ?
                  <div>
                    <div>Exchanges</div>
                    {this.state.item.data.exchanges.map((e: any)=>{
                      return <div>
                      <div className="mb-3">
                        <label className="form-label">Select: {e.index} - wallet</label>
                        {this.state.createFollowMapping &&
                          this.state.createFollowMapping.exchanges &&
                          this.state.createFollowMapping.exchanges[e.index] ?
                          <div onClick={()=>this.addToMapping('exchanges', e.index, undefined)}>{this.state.createFollowMapping.exchanges[e.index].name}</div>
                        :
                          <DropdownButton
                            title={''}
                          >
                            { this.state.accounts.map((account:any, index: number) => {
                              return <Dropdown.Item key={account.id} onClick={()=>this.addToMapping('exchanges', e.index, account)}>{account.name}</Dropdown.Item>
                            })}
                          </DropdownButton>
                        }
                      </div>
                    </div>
                    })}
                  </div>
                : null}
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
                  <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.setupFollow()}>Start following</Button>
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