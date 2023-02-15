import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Table } from 'react-bootstrap'
import Menu2 from './Menu2'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { truncate } from '../utils'

interface DashProps {
  history: any,
  location: any,
  match: any
}

type DashStates = {
  search: string
  tokens: any[]
  smartcontracts: any[]
  pairs: any[]
  profileOpen: boolean
}

class Dash extends Component <DashProps, DashStates> {

  constructor (props: DashProps) {
    super(props)
    this.state = {
      search: '',
      tokens: [],
      smartcontracts: [],
      pairs: [],
      profileOpen: false
    }
  }

  inputChange = (event: any) => {
    if (event.currentTarget.value.length === 0) {
      this.setState({
        tokens: [],
        smartcontracts: [],
        pairs: [],
        search: ''
      })
    } else {
      this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DashStates, () => this.searchTop())
    }
  }

  logout = () => {
    localStorage.removeItem('accounts')
    this.props.history.push('/')
  }

  searchTop = (event: any = undefined) => {
    if (event !== undefined) event.preventDefault()
    const { token } = getCredentials()

    // tokens
    const query1 = `?search=${this.state.search}&limit=3&offset=0`
    fetch(
      config.app.apiUri + '/api/v1/dextokens'+query1, {
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
            tokens: json.tokens
          })
        } else {
          this.setState({
            tokens: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })

    // smart contracts
    const query2 = `?search=${this.state.search}&limit=3&offset=0`
    fetch(
      config.app.apiUri + '/api/v1/dexsmartcontracts'+query2, {
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
            smartcontracts: json.dexsmartcontracts
          })
        } else {
          this.setState({
            smartcontracts: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })

    // pairs
    const query3 = `?search=${this.state.search}&limit=3&offset=0`
    fetch(
      config.app.apiUri + '/api/v1/pairs'+query3, {
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
            pairs: json.pairs
          })
        } else {
          this.setState({
            pairs: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <>
        <div className="wrapper main-holder">
          <Menu2/>
          <div className="content-with-topbar-holder">
            <div className="navbar-custom">
              <div className="topbar-search">
                <form onSubmit={(event) => this.searchTop(event)} className="me-1">
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" autoComplete="off" name="search" value={this.state.search} onChange={this.inputChange} placeholder=""/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
                { this.state.tokens.length > 0 || this.state.smartcontracts.length > 0 || this.state.pairs.length > 0 ?
                  <div className="search-results card">
                    { this.state.tokens.length > 0 ?
                      <Table striped className="mb-2" size="sm">
                        <thead>
                          <tr>
                            <th scope="col">Tokens</th>
                            <th scope="col">Chain</th>
                            <th scope="col">Symbol</th>
                            <th scope="col">Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.tokens.map((token:any) => {
                            return (
                              <tr key={token.id}>
                                <td className="font-monospace">
                                  <Link to={`/dextokens/${token.id}`}>{truncate(token.id, 10)}</Link>
                                </td>
                                <td>{token.dexchain.name}</td>
                                <td>{token.symbol}</td>
                                <td>{token.name}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    : null}
                    { this.state.smartcontracts.length > 0 ?
                      <Table striped className="mb-2" size="sm">
                        <thead>
                          <tr>
                            <th scope="col">Contracts</th>
                            <th scope="col">Chain</th>
                            <th scope="col">Symbol</th>
                            <th scope="col">Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.smartcontracts.map((smartcontract:any) => {
                            return (
                              <tr key={smartcontract.id}>
                                <td className="font-monospace">
                                  <Link to={`/dexsmartcontracts/${smartcontract.id}`}>{truncate(smartcontract.id, 10)}</Link>
                                </td>
                                <td>{smartcontract.dexchain.name}</td>
                                <td>{smartcontract.name}</td>
                                <td>{smartcontract.description}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    : null }
                    { this.state.pairs.length > 0 ?
                      <Table striped className="mb-2" size="sm">
                        <thead>
                          <tr>
                            <th scope="col">Pairs</th>
                            <th scope="col">Alias</th>
                            <th scope="col">Exchange</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.pairs.map((pair:any) => {
                            return (
                              <tr key={pair.id}>
                                <td><Link to={`/pairs/${pair.id}`}>{pair.pair}</Link></td>
                                <td>{pair.account.name}</td>
                                <td>{pair.account.exchange.name}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    : null}
                  </div>
                : null}
              </div>
              <div className="topbar-profile">
                <i className="dripicons dripicons-user topbar-usericon" onClick={() => this.setState({profileOpen: !this.state.profileOpen})}/>
                {this.state.profileOpen ?
                  <div className="topbar-profile-dropdown">
                    <div className="icon-holder">
                      <i className="dripicons dripicons-user"/>
                    </div>
                    <div className="topbar-logout" onClick={() => this.logout()}>
                      Logout
                    </div>
                  </div>
                : null}
              </div>
            </div>
            <div className="content-page">
              <div className="content">
                <Container fluid>
                  {this.props.children}
                </Container>
              </div>
              <footer className="footer">
                <div className="container-fluid">
                  <Row>
                    <Col md={6}>
                      <div className="footer-links d-none d-md-block">
                        <a target="_blank" rel="noreferrer" href="https://deltaport.io">Deltaport.io <i className="uil uil-external-link-alt"></i></a>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="text-md-end footer-links d-none d-md-block">
                        <a target="_blank" rel="noreferrer" href="https://github.com/Deltaport-io/deltaport">Github <i className="uil uil-external-link-alt"></i></a>
                        <a target="_blank" rel="noreferrer" href="https://github.com/Deltaport-io/deltaport/issues">Support <i className="uil uil-external-link-alt"></i></a>
                        <a target="_blank" rel="noreferrer" href="mailto:contact@deltaport.io">Contact <i className="uil uil-external-link-alt"></i></a>
                      </div>
                    </Col>
                  </Row>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(Dash);