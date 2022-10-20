import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table, Dropdown, DropdownButton, Pagination } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'
import { fromDisplayBalance, getDisplayBalance } from '../utils'
import { getCredentials } from '../credcontrols'

interface MarketplaceProps {
  history: any,
  location: any,
  match: any
}

type MarketplaceStates = {
  search: string
  viewBots: boolean
  viewSubscriptions: boolean
  viewScripts: boolean
  viewJobs: boolean
  minPrice: string
  maxPrice: string
  viewOrder: number
  items: any[]
  entries: number
  page: number
}

const ordering = [{
  name: 'Recent',
  api: 'creatednewest'
},{
  name: 'Oldest',
  api: 'createdoldest'
},{
  name: 'Cheapest',
  api: 'pricedesc'
},{
  name: 'Priciest',
  api: 'priceasc'
}]

const itemsPerPage = 30

class Marketplace extends Component <MarketplaceProps, MarketplaceStates> {

  constructor (props: MarketplaceProps) {
    super(props)
    this.state = {
      search: '',
      viewBots: true,
      viewSubscriptions: true,
      viewScripts: true,
      viewJobs: true,
      minPrice: '0',
      maxPrice: '',
      viewOrder: 0,
      items: [],
      entries: 0,
      page: 0
    }
  }

  componentDidMount () {
    if(this.props.location.search){
      const search = new URLSearchParams(this.props.location.search).get('search')!
      this.setState({
        search
      }, () => {
        this.searchMarketplace()
      })
    } else {
      this.searchMarketplace()
    }
  }

  componentWillUnmount () {
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as MarketplaceStates)
  }

  searchMarketplace = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    const arrayOfTypes = []
    if (this.state.viewBots) arrayOfTypes.push('Bot')
    if (this.state.viewJobs) arrayOfTypes.push('Job')
    if (this.state.viewScripts) arrayOfTypes.push('Script')
    if (this.state.viewSubscriptions) arrayOfTypes.push('Subscription')
    fetch(
      `${config.app.apiUri}/api/v1/marketplace?search=${this.state.search}&order=${ordering[this.state.viewOrder].api}&minPrice=${this.state.minPrice==='0'?'0':fromDisplayBalance(this.state.minPrice,'18')}&maxPrice=${this.state.maxPrice===''?'99999999999999999999999999999999':fromDisplayBalance(this.state.maxPrice,'18')}&type=${arrayOfTypes.join(",")}&offset=${this.state.page * itemsPerPage}&limit=${itemsPerPage}`, {
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
            items: json.results
          })
        } else {
          this.setState({
            items: []
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
              { label: 'Marketplace', path: '/marketplace', active: true },
            ]}
            title={'Marketplace'}
          />
          <Card>
            <Card.Body>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <div>
                    <form onSubmit={this.searchMarketplace} className="me-1">
                      <div className="input-group input-group-sm">
                        <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder=""/>
                        <button className="btn btn-primary" type="submit">Search</button>
                      </div>
                    </form>
                  </div>
                  <div>
                    <div className="mb-1 me-1 btn-group">
                      <button onClick={()=>{this.setState({search: 'purchased:mine'}, ()=>this.searchMarketplace())}} type="button" className={"btn btn-sm btn-primary"}>Purchased</button>
                    </div>
                    <div className="mb-1 me-1 btn-group">
                      <button onClick={()=>{this.setState({search: 'owner:mine'}, ()=>this.searchMarketplace())}} type="button" className={"btn btn-sm btn-primary"}>Mine</button>
                    </div>
                    <div className="mb-1 me-1 btn-group">
                      <button onClick={()=>{this.props.history.push('/marketplace/add')}} type="button" className={"btn btn-sm btn-primary"}>Add</button>
                    </div>
                  </div>
                </div>
                <div className="d-flex">
                  <div className="mb-1 me-1 btn-group">
                    <button onClick={()=>this.setState({viewBots: this.state.viewBots ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewBots ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Bots</button>
                    <button onClick={()=>this.setState({viewSubscriptions: this.state.viewSubscriptions ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewSubscriptions ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Subscriptions</button>
                    <button onClick={()=>this.setState({viewScripts: this.state.viewScripts ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewScripts ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Scripts</button>
                    <button onClick={()=>this.setState({viewJobs: this.state.viewJobs ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewJobs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Jobs</button>
                  </div>
                  <DropdownButton
                    title={ordering[this.state.viewOrder].name}
                    size="sm"
                  >
                    {ordering.map((orderingType, index)=>{
                      return <Dropdown.Item key={orderingType.name} onClick={() => this.setState({viewOrder: index})}>{orderingType.name}</Dropdown.Item>
                    })}
                  </DropdownButton>
                </div>
                <div className="d-inline-flex mb-2">
                  <div className="input-group input-group-sm">
                    <button className="btn btn-primary" onClick={()=>this.searchMarketplace()}>Price range</button>
                    <input type="text" className="form-control form-control-sm" name="minPrice" value={this.state.minPrice} onChange={this.inputChange} placeholder="0"/>
                    <input type="text" className="form-control form-control-sm" name="maxPrice" value={this.state.maxPrice} onChange={this.inputChange} placeholder="Max"/>
                  </div>
                </div>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.items.map((item:any) => {
                    return (
                      <tr key={item.id}>
                        <td><Link to={`/marketplace/${item.id}`}>{item.title}</Link></td>
                        <td>{item.type}</td>
                        <td>{item.description}</td>
                        <td>{getDisplayBalance(item.price,'18')}</td>
                        <td><Moment format="DD/MM/YYYY kk:mm:ss">{item.added}</Moment></td>
                      </tr>
                    )
                  })}
                  {this.state.items.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No items yet.</td></tr>
                  : null}
                </tbody>
              </Table>
              {this.state.entries > itemsPerPage && !this.state.search.startsWith('purchased:mine')
                ? <Pagination className="justify-content-center mt-3">
                  {this.state.page > 0 ? <Pagination.Prev onClick={() => this.setState({ page: this.state.page - 1 }, () => { this.searchMarketplace() })} /> : null}
                  {[...Array(Math.ceil(this.state.entries / itemsPerPage))].map((e:any, number:any) => {
                    return (this.state.page - 4 < number && number < this.state.page + 4) ? <Pagination.Item key={number} active={number === this.state.page} onClick={() => this.setState({ page: number }, () => { this.searchMarketplace() })}>{number + 1}</Pagination.Item> : null
                  })}
                  {this.state.page < Math.floor(this.state.entries / itemsPerPage) ? <Pagination.Next onClick={() => this.setState({ page: this.state.page + 1 }, () => { this.searchMarketplace() })} /> : null}
                </Pagination>
                : null}
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(Marketplace);