import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, Pagination } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from "react-router-dom"
import { getPromoted } from '../utils'

interface DexTokensProps {
  history: any,
  location: any,
  match: any
}

type DexTokensStates = {
  search: string
  tokens: any[]
  entries: number
  page: number
}

const itemsPerPage = 20

class DexTokens extends Component <DexTokensProps, DexTokensStates> {

  constructor (props: DexTokensProps) {
    super(props)
    this.state = {
      search: '',
      tokens: [],
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
        this.searchTokens()
      })
    } else {
      this.searchTokens()
    }
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexTokensStates)
  }

  searchTokens = (event: any = null) => {
    window.scrollTo(0,0)
    if (event !== null) {
      event.preventDefault()
    }
    const { token } = getCredentials()
    const query = this.state.search !== '' ?
      `?search=${this.state.search}&offset=${this.state.page * itemsPerPage}` :
      `?offset=${this.state.page * itemsPerPage}`
    fetch(
      config.app.apiUri + '/api/v1/dextokens'+query, {
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
            tokens: json.tokens,
            entries: json.entries
          })
        } else {
          this.setState({
            tokens: [],
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
      <div className="Tokens">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Tokens', path: '/dextokens', active: true },
            ]}
            title={'Tokens'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Tokens</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchTokens}>
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
                    <th scope="col">Symbol</th>
                    <th scope="col">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.tokens.map((token:any) => {
                    return (
                      <tr key={token.id}>
                        <td>{promoted.includes(token.symbol) ? <i className="mdi mdi-star text-warning"></i> : null}</td>
                        <td className="font-monospace"><Link to={`/dextokens/${token.id}`}>{token.id}</Link></td>
                        <td>{token.symbol}</td>
                        <td>{token.name}</td>
                      </tr>
                    )
                  })}
                  {this.state.tokens.length === 0 ?
                    <tr><td colSpan={4} className="py-4 text-center">No tokens found or available.</td></tr>
                  : null}
                </tbody>
              </Table>
              {this.state.entries > itemsPerPage
                ? <Pagination className="justify-content-center mt-3">
                  {this.state.page > 0 ? <Pagination.Prev onClick={() => this.setState({ page: this.state.page - 1 }, () => { this.searchTokens() })} /> : null}
                  {[...Array(Math.ceil(this.state.entries / itemsPerPage))].map((e:any, number:any) => {
                    return (this.state.page - 4 < number && number < this.state.page + 4) ? <Pagination.Item key={number} active={number === this.state.page} onClick={() => this.setState({ page: number }, () => { this.searchTokens() })}>{number + 1}</Pagination.Item> : null
                  })}
                  {this.state.page < Math.floor(this.state.entries / itemsPerPage) ? <Pagination.Next onClick={() => this.setState({ page: this.state.page + 1 }, () => { this.searchTokens() })} /> : null}
                </Pagination>
                : null}
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexTokens);