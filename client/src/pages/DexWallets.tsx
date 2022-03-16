import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Modal, Button, Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'

interface DexWalletsProps {
  history: any,
  location: any,
  match: any
}

type DexWalletsStates = {
  isLoading: boolean
  type: string
  name: string
  seedphrase: string
  nodeurl: string
  txviewer: string
  walletindex: number
  wallets: any[]
  error: string
  errors: any
  showModal: boolean
  search: string
}

class DexWallets extends Component <DexWalletsProps, DexWalletsStates> {
  constructor (props: DexWalletsProps) {
    super(props)
    this.state = {
      isLoading: false,
      type: '',
      name: '',
      seedphrase: '',
      nodeurl: '',
      walletindex: 0,
      txviewer: 'https://etherscan.io/tx/',
      wallets: [],
      error: '',
      errors: {},
      showModal: false,
      search: ''
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexWalletsStates)
  }

  componentDidMount () {
    if(this.props.location.search){
      const search = new URLSearchParams(this.props.location.search).get('search')!
      this.setState({
        search
      }, () => {
        this.loadDexWallets()
      })
    } else {
      this.loadDexWallets()
    }
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
            wallets: json.dexwallets
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  save = () => {
    this.setState({isLoading:true})
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexwallets/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          name: this.state.name,
          seedphrase: this.state.seedphrase,
          nodeurl: this.state.nodeurl,
          walletindex: this.state.walletindex,
          txviewer: this.state.txviewer
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            isLoading: false,
            name: '',
            seedphrase: '',
            nodeurl: '',
            walletindex: 0,
            txviewer: 'https://etherscan.io/tx/',
            errors: {},
            error: '',
            showModal: false
          })
          this.loadDexWallets()
        } else {
          console.log(json)
          this.setState({
            isLoading: false,
            errors: json.errors,
            error: json.message
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  remove = (id: string) => {
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/dexwallets/'+id, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.loadDexWallets()
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  openModal = () => {
    this.setState({
      showModal: true
    })
  }

  closeModal = () => {
    this.setState({
      showModal: false
    })
  }

  render() {
    return (
      <div className="DexWallets">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Wallets', path: '/dexwallets', active: true },
            ]}
            title={'Wallets'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Wallets</h4>
              <div className="d-flex float-end mb-2">
                <button onClick={()=>this.openModal()} type="button" className="btn btn-primary btn-sm">New wallet</button>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col">Alias</th>
                    <th scope="col">Address</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.wallets.map((wallet:any) => {
                    return (
                      <tr key={wallet.name}>
                        <td><Link to={`/dexwallets/${wallet.id}`}>{wallet.name}</Link></td>
                        <td className="font-monospace">{wallet.address}</td>
                        <td>
                          <OverlayTrigger placement="bottom" overlay={<Tooltip> Remove </Tooltip>}>
                            <span className="link-primary ms-2" style={{cursor: 'pointer'}} onClick={()=>this.remove(wallet.id)}><i className="dripicons dripicons-trash"></i></span>
                          </OverlayTrigger>  
                        </td>
                      </tr>
                    )
                  })}
                  {this.state.wallets.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No wallets, add new one first.</td></tr>
                  : null}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Dash>
        <Modal show={this.state.showModal} onHide={this.closeModal} animation={false} centered>
          <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Modal.Title>Add wallet</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="ps-3 pe-3">
              <div className="mb-3">
                <label className="form-label">Alias</label>
                <input type="text" className="form-control" name="name" value={this.state.name} onChange={this.inputChange} placeholder="Alias"/>
              </div>
              <div className="mb-3">
                <label className="form-label">Seedphrase</label>
                <input type="text" className="form-control" name="seedphrase" value={this.state.seedphrase} onChange={this.inputChange} placeholder="Seedphrase"/>
              </div>
              <div className="mb-3">
                <label className="form-label">Node URL</label>
                <input type="text" className="form-control" name="nodeurl" value={this.state.nodeurl} onChange={this.inputChange} placeholder="Ethereum Node URL"/>
              </div>
              <div className="mb-3">
                <label className="form-label">Wallet index</label>
                <input type="text" className="form-control" name="accindex" value={this.state.walletindex} onChange={this.inputChange}/>
              </div>
              <div className="mb-3">
                <label className="form-label">Tx viewer</label>
                <input type="text" className="form-control" name="txviewer" value={this.state.txviewer} onChange={this.inputChange}/>
              </div>
              { this.state.error !== ''
                ? <div className="alert alert-danger alerterror">
                  {this.state.error}
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
                <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.save()}>Add</Button>
              </div>
            }
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default withRouter(DexWallets)