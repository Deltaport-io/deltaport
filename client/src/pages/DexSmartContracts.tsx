import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { withRouter } from 'react-router'
import { Card, Table, Pagination } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import { Link } from 'react-router-dom'
import { promotedToken, truncate } from '../utils'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Info } from '../template/Info'

interface DexSmartContractsProps {
  history: any,
  location: any,
  match: any
}

type DexSmartContractsStates = {
  search: string
  smartcontracts: any[]
  entries: number
  page: number
}

const itemsPerPage = 20

class DexSmartContracts extends Component <DexSmartContractsProps, DexSmartContractsStates> {

  constructor (props: DexSmartContractsProps) {
    super(props)
    this.state = {
      search: '',
      smartcontracts: [],
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
        this.searchSmartcontracts()
      })
    } else {
      this.searchSmartcontracts()
    }
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DexSmartContractsStates)
  }

  searchSmartcontractssubmit = (event: any = null) => {
    if (event !== null) {
      event.preventDefault()
    }
    this.setState({page:0},()=>this.searchSmartcontracts())
  }

  searchSmartcontracts = () => {
    window.scrollTo(0,0)
    const { token } = getCredentials()
    const query = this.state.search !== '' ?
      `?search=${this.state.search}&offset=${this.state.page * itemsPerPage}` :
      `?offset=${this.state.page * itemsPerPage}`
    fetch(
      config.app.apiUri + '/api/v1/dexsmartcontracts'+query, {
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
            smartcontracts: json.dexsmartcontracts,
            entries: json.entries
          })
        } else {
          this.setState({
            smartcontracts: [],
            entries: 0
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div className="Smartcontracts">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Smartcontracts', path: '/dexsmartcontracts', active: true },
            ]}
            title={'Smartcontracts'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">Smartcontracts</h4>
              <div className="d-flex float-end mb-2">
                <form className="d-flex" onSubmit={this.searchSmartcontractssubmit}>
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder="Action or Token symbol"/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col" style={{width: 31}}><i className="mdi mdi-star text-secondary"></i></th>
                    <th scope="col">Id</th>
                    <th scope="col">Chain</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Description</th>
                    <th scope="col"><i className="mdi mdi-information text-secondary"></i></th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.smartcontracts.map((smartcontract:any) => {
                    return (
                      <tr key={smartcontract.id}>
                        <td>{ promotedToken(smartcontract.dextokens) ? <i className="mdi mdi-star text-warning"></i> : null }</td>
                        <td className="font-monospace">
                          <Link to={`/dexsmartcontracts/${smartcontract.id}`}>{truncate(smartcontract.id, 10)}</Link>
                        </td>
                        <td>{smartcontract.dexchain.name}</td>
                        <td>{smartcontract.name}</td>
                        <td>{smartcontract.description}</td>
                        <td><Info data={smartcontract.apiguide}/></td>
                      </tr>
                    )
                  })}
                  {this.state.smartcontracts.length === 0 ?
                    <tr><td colSpan={6} className="py-4 text-center">No smartcontracts found or available</td></tr>
                  : null}
                </tbody>
              </Table>
              {this.state.entries > itemsPerPage
                ? <Pagination className="justify-content-center mt-3">
                  {this.state.page > 0 ? <Pagination.Prev onClick={() => this.setState({ page: this.state.page - 1 }, () => { this.searchSmartcontracts() })} /> : null}
                  {[...Array(Math.ceil(this.state.entries / itemsPerPage))].map((e:any, number:any) => {
                    return (this.state.page - 4 < number && number < this.state.page + 4) ? <Pagination.Item key={number} active={number === this.state.page} onClick={() => this.setState({ page: number }, () => { this.searchSmartcontracts() })}>{number + 1}</Pagination.Item> : null
                  })}
                  {this.state.page < Math.floor(this.state.entries / itemsPerPage) ? <Pagination.Next onClick={() => this.setState({ page: this.state.page + 1 }, () => { this.searchSmartcontracts() })} /> : null}
                </Pagination>
                : null}
            </Card.Body>
          </Card>
        </Dash>
      </div>
    );
  }
}

export default withRouter(DexSmartContracts);