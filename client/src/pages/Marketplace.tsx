import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table, Dropdown, DropdownButton } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import { Link } from 'react-router-dom'
import { fromDisplayBalance, getDisplayBalance } from '../utils'

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
      items: []
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
    const arrayOfTypes = []
    if (this.state.viewBots) arrayOfTypes.push('Bot')
    if (this.state.viewJobs) arrayOfTypes.push('Job')
    if (this.state.viewScripts) arrayOfTypes.push('Script')
    if (this.state.viewSubscriptions) arrayOfTypes.push('Subscription')
    fetch(
      `${config.app.apiUri}/api/v1/marketplace?search=${this.state.search}&order=${ordering[this.state.viewOrder].api}&minPrice=${this.state.minPrice==='0'?'0':fromDisplayBalance(this.state.minPrice,'18')}&maxPrice=${this.state.maxPrice===''?'99999999999999999999999999999999':fromDisplayBalance(this.state.maxPrice,'18')}&type=${arrayOfTypes.join(",")}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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
              <div className="d-flex float-start mb-2">
                <form onSubmit={this.searchMarketplace} className="mb-2 me-1">
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder=""/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
                <div className="mb-2 me-1 btn-group">
                  <button onClick={()=>this.setState({viewBots: this.state.viewBots ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewBots ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Bots</button>
                  <button onClick={()=>this.setState({viewSubscriptions: this.state.viewSubscriptions ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewSubscriptions ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Subscriptions</button>
                  <button onClick={()=>this.setState({viewScripts: this.state.viewScripts ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewScripts ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Scripts</button>
                  <button onClick={()=>this.setState({viewJobs: this.state.viewJobs ? false : true}, ()=>this.searchMarketplace())} type="button" className={this.state.viewJobs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Jobs</button>
                </div>
                <div className="mb-2 me-1 btn-group">
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="minPrice" value={this.state.minPrice} onChange={this.inputChange} placeholder="0"/>
                  </div>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="maxPrice" value={this.state.maxPrice} onChange={this.inputChange} placeholder="Max"/>
                  </div>
                </div>
                <div className="mb-2 me-1 btn-group">
                  <DropdownButton
                    title={ordering[this.state.viewOrder].name}
                    size="sm"
                  >
                    {ordering.map((orderingType, index)=>{
                      return <Dropdown.Item key={orderingType.name} onClick={() => this.setState({viewOrder: index})}>{orderingType.name}</Dropdown.Item>
                    })}
                  </DropdownButton>
                </div>
                <div className="mb-2 me-1 btn-group">
                  <button onClick={()=>{this.props.history.push('/marketplace/add')}} type="button" className={"btn btn-sm btn-primary"}>Add</button>
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
                        <td><Moment format="DD/MM/YYYY h:mm:ss A">{item.added}</Moment></td>
                      </tr>
                    )
                  })}
                  {this.state.items.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No items yet.</td></tr>
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

export default withRouter(Marketplace);