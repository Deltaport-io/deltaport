import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, Pagination } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { getPromoted } from '../utils'

interface DexPoolsProps {
  history: any,
  location: any,
  match: any
}

type DexPoolsStates = {
  search: string
  pools: any[]
  entries: number
  page: number
}

const itemsPerPage = 20

class DexPools extends Component <DexPoolsProps, DexPoolsStates> {

  constructor (props: DexPoolsProps) {
    super(props)
    this.state = {
      search: '',
      pools: [],
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
        this.searchPools()
      })
    } else {
      this.searchPools()
    }
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexPoolsStates)
  }

  searchPools = (event: any = null) => {
    window.scrollTo(0,0)
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    const query = this.state.search !== '' ?
      `?search=${this.state.search}&offset=${this.state.page * itemsPerPage}` :
      `?offset=${this.state.page * itemsPerPage}`
    fetch(
      config.app.apiUri + '/api/v1/dexpools'+query, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
        // creds
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            pools: json.dexpools,
            entries: json.entries
          })
        } else {
          this.setState({
            pools: [],
            entries: 0
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    const promoted = getPromoted()
    return (
      <div className="Pools">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Pools', path: '/dexpools', active: true },
            ]}
            title={'Pools'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Pools</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchPools}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Token name"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Address</th>
                    <th scope="col">Tokens</th>
                    <th scope="col">Fee</th>
                    <th scope="col">Dex</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.pools.map((pool:any) => {
                    return (
                      <tr key={pool.id}>
                        <td>{promoted.includes(pool.token0.symbol) || promoted.includes(pool.token1.symbol) ? <i className="mdi mdi-star text-warning"></i> : null}</td>
                        <td className="font-monospace"><Link to={`/dexpools/${pool.id}`}>{pool.id}</Link></td>
                        <td>{pool.token0.symbol} / {pool.token1.symbol}</td>
                        <td>{pool.feetier / 10000}%</td>
                        <td>{pool.dex.name}</td>
                      </tr>
                    )
                  })}
                  {this.state.pools.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No pools found or available</td></tr>
                  : null}
                </tbody>
              </Table>
              {this.state.entries > itemsPerPage
                ? <Pagination className="justify-content-center mt-3">
                  {this.state.page > 0 ? <Pagination.Prev onClick={() => this.setState({ page: this.state.page - 1 }, () => { this.searchPools() })} /> : null}
                  {[...Array(Math.ceil(this.state.entries / itemsPerPage))].map((e:any, number:any) => {
                    return (this.state.page - 4 < number && number < this.state.page + 4) ? <Pagination.Item key={number} active={number === this.state.page} onClick={() => this.setState({ page: number }, () => { this.searchPools() })}>{number + 1}</Pagination.Item> : null
                  })}
                  {this.state.page < Math.floor(this.state.entries / itemsPerPage) ? <Pagination.Next onClick={() => this.setState({ page: this.state.page + 1 }, () => { this.searchPools() })} /> : null}
                </Pagination>
                : null}
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexPools);