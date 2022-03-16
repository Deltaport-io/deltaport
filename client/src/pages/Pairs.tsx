import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Link } from "react-router-dom";
import { Card, Table, Pagination } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { getPromoted } from '../utils'

interface PairsProps {
  history: any,
  location: any,
  match: any
}

type PairsStates = {
  search: string
  pairs: any[]
  entries: number
  page: number
}

const itemsPerPage = 20

class Pairs extends Component <PairsProps, PairsStates> {

  constructor (props: PairsProps) {
    super(props)
    this.state = {
      search: '',
      pairs: [],
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
        this.searchPairs()
      })
    } else {
      this.searchPairs()
    }
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as PairsStates)
  }

  searchPairs = (event: any = null) => {
    window.scrollTo(0,0)
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    const query = this.state.search !== '' ?
      `?search=${this.state.search}&offset=${this.state.page * itemsPerPage}` :
      `?offset=${this.state.page * itemsPerPage}`
    fetch(
      config.app.apiUri + '/api/v1/pairs'+query, {
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
            pairs: json.pairs,
            entries: json.entries
          })
        } else {
          this.setState({
            pairs: [],
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
      <div className="Pairs">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Pairs', path: '/pairs', active: true },
            ]}
            title={'Pairs'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Pairs</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchPairs}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Pair name"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Name</th>
                    <th scope="col">Account</th>
                    <th scope="col">Exchange</th>
                    <th scope="col">Spot</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.pairs.map((pair:any) => {
                    return (
                      <tr key={pair.id}>
                        <td>{promoted.includes(pair.spot) || promoted.includes(pair.base) ? <i className="mdi mdi-star text-warning"></i> : null}</td>
                        <td><Link to={`/pairs/${pair.id}`}>{pair.pair}</Link></td>
                        <td>{pair.account.name}</td>
                        <td>{pair.account.exchange.name}</td>
                        <td>{pair.spot ? 'true' : 'false'}</td>
                      </tr>
                    )
                  })}
                  {this.state.pairs.length === 0 ?
                    <tr><td colSpan={5} className="py-4 text-center">No pairs found or available. Modify search / connect to exchange</td></tr>
                  : null}
                </tbody>
              </Table>
              {this.state.entries > itemsPerPage
                ? <Pagination className="justify-content-center mt-3">
                  {this.state.page > 0 ? <Pagination.Prev onClick={() => this.setState({ page: this.state.page - 1 }, () => { this.searchPairs() })} /> : null}
                  {[...Array(Math.ceil(this.state.entries / itemsPerPage))].map((e:any, number:any) => {
                    return (this.state.page - 4 < number && number < this.state.page + 4) ? <Pagination.Item key={number} active={number === this.state.page} onClick={() => this.setState({ page: number }, () => { this.searchPairs() })}>{number + 1}</Pagination.Item> : null
                  })}
                  {this.state.page < Math.floor(this.state.entries / itemsPerPage) ? <Pagination.Next onClick={() => this.setState({ page: this.state.page + 1 }, () => { this.searchPairs() })} /> : null}
                </Pagination>
                : null}
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(Pairs);