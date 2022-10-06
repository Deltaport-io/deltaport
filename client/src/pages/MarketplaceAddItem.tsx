import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Dropdown, DropdownButton } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import AceEditor from "react-ace"
import { getCredentials } from '../credcontrols'
import { fromDisplayBalance } from '../utils'

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

interface MarketplaceAddItemProps {
  history: any,
  location: any,
  match: any
}

type MarketplaceAddItemStates = {
  title: string
  description: string
  type: number
  price: string
  data: any
  search: string
  searchDropDownVisible: boolean
  searchResults: any
  selectedBotOrTrading: any
  error: any
  isLoading: boolean
  wallets: any[]
  selectedWallet: any
}

const types = ['Bot', 'Script', 'Subscription', 'Job']

class MarketplaceAddItem extends Component <MarketplaceAddItemProps, MarketplaceAddItemStates> {

  constructor (props: MarketplaceAddItemProps) {
    super(props)
    this.state = {
      title: '',
      description: '',
      type: 0,
      price: '0',
      data: undefined,
      search: '',
      searchDropDownVisible: false,
      searchResults: [],
      selectedBotOrTrading: undefined,
      error: undefined,
      isLoading: false,
      wallets: [],
      selectedWallet: undefined
    }
  }

  componentDidMount () {
    this.loadDexWallets()
  }

  componentWillUnmount () {
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as MarketplaceAddItemStates)
  }

  inputChangeWithBotSearch = (event: any = null) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as MarketplaceAddItemStates, ()=>this.searchBots())
  }

  inputChangeWithTradingsSearch = (event: any = null) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as MarketplaceAddItemStates, ()=>this.searchTradings())
  }

  onChange = (newData: string) => {
    this.setState({data: newData})
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

  addToMarketplace = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    this.setState({error: '', isLoading: true})
    fetch(
      config.app.apiUri + '/api/v1/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          title: this.state.title,
          description: this.state.description,
          type: types[this.state.type],
          price: fromDisplayBalance(this.state.price, '18'),
          data: this.state.data,
          wallet: this.state.selectedWallet.id,
          botorsession: this.state.selectedBotOrTrading ? this.state.selectedBotOrTrading.id : ''
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            title: '',
            description: '',
            type: 0,
            price: '0',
            data: undefined,
            selectedBotOrTrading: undefined,
            isLoading: false
          })
          this.props.history.push('/marketplace/'+json.id)
        } else {
          this.setState({
            error: json.message,
            isLoading: false
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  searchBots (event: any = null) {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      `${config.app.apiUri}/api/v1/bots?search=${this.state.search}&order=creatednewest&limit=5`, {
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
            searchResults: json.bots
          })
        } else {
          // this.setState({error: json.message})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  searchTradings = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    fetch(
      `${config.app.apiUri}/api/v1/tradings?search=${this.state.search}&order=creatednewest&limit=5`, {
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
            searchResults: json.tradings
          })
        } else {
          this.setState({
            // tradings: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div className="Marketplace">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Marketplace', path: '/marketplace' },
              { label: 'Add', path: '/marketplace/add', active: true }
            ]}
            title={'Add to Marketplace'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title mb-3 d-inline-block">Add to Marketplace</h4>
              <div className="mb-2">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" name="title" value={this.state.title} onChange={this.inputChange} placeholder=""/>
              </div>
              <div className="mb-2">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  placeholder=""
                  rows={3}
                  onChange={this.inputChange}
                  value={this.state.description}
                >
                  {this.state.description}
                </textarea>
              </div>
              <div className="mb-2">
                <label className="form-label">Wallet</label>
                <DropdownButton
                  title={ this.state.selectedWallet ? this.state.selectedWallet.name : 'Select wallet' }
                >
                  { this.state.wallets.map((wallet:any, index: number) => {
                    return <Dropdown.Item key={wallet.id} onClick={() => this.setState({selectedWallet: wallet})}>{wallet.name}</Dropdown.Item>
                  })}
                </DropdownButton>
              </div>
              <div className="mb-2">
                <label className="form-label">Type</label>
                <DropdownButton
                  title={ types[this.state.type] }
                >
                  { types.map((type:any, index: number) => {
                    return <Dropdown.Item key={type} onClick={() => this.setState({type: index, data: undefined, selectedBotOrTrading: undefined, search: '', searchResults: []})}>{type}</Dropdown.Item>
                  })}
                </DropdownButton>
              </div>
              <div className="mb-2">
                {this.state.type === 0 ?
                  <div>
                    <div className="mb-2">
                      <label className="form-label">Price</label>
                      <input type="text" className="form-control" name="price" value={this.state.price} onChange={this.inputChange} placeholder=""/>
                    </div>
                    <label className="form-label">Select bot</label>
                    {this.state.selectedBotOrTrading !== undefined ?
                      <li onClick={()=>this.setState({selectedBotOrTrading: undefined, searchDropDownVisible: false})} className="list-group-item"><span style={{fontWeight: 'bold'}}>{this.state.selectedBotOrTrading.name}</span> created:<Moment format="DD/MM/YYYY h:mm:ss A">{this.state.selectedBotOrTrading.createdAt}</Moment></li>
                    :
                      <div>
                        <form className="d-flex" onSubmit={this.searchBots}>
                          <div className="input-group input-group">
                            <input
                              type="text"
                              className="form-control form-control"
                              name="search"
                              value={this.state.search}
                              autoComplete="false"
                              onChange={this.inputChangeWithBotSearch}
                              onFocus={()=>{this.setState({searchDropDownVisible: true});this.searchBots()}}
                              onBlur={()=>this.setState({searchDropDownVisible: false})}
                              placeholder="Bots"
                            />
                            <button className="btn btn-primary" type="submit">Search</button>
                          </div>
                        </form>
                        {this.state.searchDropDownVisible ?
                          <ul className="list-group">
                            {this.state.searchResults.map((result: any) => {
                              return <li key={result.id} onMouseDown={(event)=>{this.setState({selectedBotOrTrading: result})}} className="list-group-item"><span style={{fontWeight: 'bold'}}>{result.name}</span> created:<Moment format="DD/MM/YYYY h:mm:ss A">{result.createdAt}</Moment></li>
                            })}
                          </ul>
                        :null}
                      </div>
                    }
                  </div>
                :null}
                {this.state.type === 1 ?
                  <div>
                    <div className="mb-2">
                      <label className="form-label">Price</label>
                      <input type="text" className="form-control" name="price" value={this.state.price} onChange={this.inputChange} placeholder=""/>
                    </div>
                    <label className="form-label">Script</label>
                    <div style={{height: 300,position:'relative'}}>
                      <AceEditor
                        mode="javascript"
                        theme="github"
                        height="100%"
                        width="100%"
                        onChange={this.onChange}
                        value={this.state.data}
                        setOptions={{ useWorker: false }}
                      />
                    </div>
                  </div>
                :null}
                {this.state.type === 2 ?
                  <div>
                    <div className="mb-2">
                      <label className="form-label">Price/4 weeks</label>
                      <input type="text" className="form-control" name="price" value={this.state.price} onChange={this.inputChange} placeholder=""/>
                    </div>
                    <label className="form-label">Bot session</label>
                    {this.state.selectedBotOrTrading ?
                      <li onClick={()=>this.setState({selectedBotOrTrading: undefined, searchDropDownVisible: false})} className="list-group-item"><span style={{fontWeight: 'bold'}}>{this.state.selectedBotOrTrading.name}</span> created:<Moment format="DD/MM/YYYY h:mm:ss A">{this.state.selectedBotOrTrading.createdAt}</Moment></li>
                    :
                      <div>
                        <form className="d-flex" onSubmit={this.searchTradings}>
                          <div className="input-group input-group">
                            <input
                              type="text"
                              className="form-control form-control"
                              name="search"
                              value={this.state.search}
                              autoComplete="false"
                              onChange={this.inputChangeWithTradingsSearch}
                              onFocus={()=>{this.setState({searchDropDownVisible: true});this.searchTradings()}}
                              onBlur={()=>this.setState({searchDropDownVisible: false})}
                              placeholder="Bot sessions"
                            />
                            <button className="btn btn-primary" type="submit">Search</button>
                          </div>
                        </form>
                        {this.state.searchDropDownVisible ?
                          <ul className="list-group">
                            {this.state.searchResults.map((result: any) => {
                              return <li key={result.id} onMouseDown={(event)=>{this.setState({selectedBotOrTrading: result})}} className="list-group-item"><span style={{fontWeight: 'bold'}}>{result.name}</span> created:<Moment format="DD/MM/YYYY h:mm:ss A">{result.createdAt}</Moment></li>
                            })}
                          </ul>
                        :null}
                      </div>
                    }
                  </div>
                :null}
                {this.state.type === 3 ?
                  <div>
                    <label className="form-label">Job requirements and contact</label>
                    <textarea
                      className="form-control"
                      name="data"
                      placeholder=""
                      rows={10}
                      onChange={this.inputChange}
                      value={this.state.data}
                    >
                      {this.state.data}
                    </textarea>
                  </div>
                :null}
              </div>
              <button onClick={()=>this.addToMarketplace()} className="btn btn-primary btn">Add</button>
              { this.state.error
                ? <div className="alert alert-danger alerterror">
                  {this.state.error}
                </div>
                : null
              }
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(MarketplaceAddItem);