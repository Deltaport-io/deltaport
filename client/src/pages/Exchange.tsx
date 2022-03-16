import React, { Component } from 'react';
import Dash from '../template/Dash'
import { getCredentials } from '../credcontrols'
import { config } from '../config'
import { withRouter } from 'react-router'
import { Card, Table } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'

interface ExchangeProps {
  history: any,
  location: any,
  match: any
}

type ExchangeStates = {
  isLoading: boolean
  exchange: any
  balances: any
  positions: any
  orders: any
  timeframes: any
  functions: any
}

class Exchange extends Component <ExchangeProps, ExchangeStates> {
  constructor (props: ExchangeProps) {
    super(props)
    this.state = {
      isLoading: false,
      exchange: {},
      balances: {},
      positions: [],
      orders: [],
      timeframes: [],
      functions: []
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as ExchangeStates)
  }

  componentDidMount () {
    this.loadExchange()
  }

  loadExchange = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/exchanges/'+id, {
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
            balances: json.balances,
            positions: json.positions,
            orders: json.orders,
            timeframes: json.timeframes,
            functions: json.functions,
            exchange: json.exchange
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    const { id } = this.props.match.params
    return (
      <div className="Exchange">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Exchanges', path: '/exchanges' },
              { label: 'Exchange', path: '/exchanges/'+id, active: true }
            ]}
            title={'Exchange'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.exchange.name}</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Alias</td>
                    <td>{this.state.exchange.name}</td>
                  </tr>
                  <tr>
                    <td>Exchange</td>
                    <td>{this.state.exchange.exchange?.name}</td>
                  </tr>
                  <tr>
                    <td>Supported</td>
                    <td>{this.state.exchange.exchange?.supported}</td>
                  </tr>
                  <tr>
                    <td>Url</td>
                    <td>{this.state.exchange.exchange?.url}</td>
                  </tr>
                  <tr>
                    <td>Country</td>
                    <td>
                      {this.state.exchange.exchange ?
                        typeof this.state.exchange.exchange.countries === 'string' ? JSON.parse(this.state.exchange.exchange.countries).toString() : this.state.exchange.exchange.countries.toString() : null
                      }
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Balances</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col">Currency</th>
                    <th scope="col">Free</th>
                    <th scope="col">Used</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(this.state.balances).map((bal:any) => {
                    return (
                      <tr key={bal}>
                        <td>{bal}</td>
                        <td>{this.state.balances[bal].free}</td>
                        <td>{this.state.balances[bal].used}</td>
                        <td>{this.state.balances[bal].total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Positions</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Timestamp</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Contracts</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.positions.map((position:any) => {
                    return (
                      <tr key={position.id}>
                        <td>{position.id}</td>
                        <td>{position.timestamp}</td>
                        <td>{position.symbol}</td>
                        <td>{position.side}</td>
                        <td>{position.contracts}</td>
                        <td>{position.price}</td>
                        <td>{position.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Orders</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Datetime</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.orders.map((order:any) => {
                    return (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.datetime}</td>
                        <td>{order.symbol}</td>
                        <td>{order.type}</td>
                        <td>{order.side}</td>
                        <td>{order.price}</td>
                        <td>{order.amount}</td>
                        <td>{order.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Timeframes</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col">Timeframe</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.timeframes.map((timeframe:any) => {
                    return (
                      <tr key={timeframe}>
                        <td>{timeframe}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">Supported functions</h4> 
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th scope="col">Function</th>
                    <th scope="col">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(this.state.functions).map((func:any) => {
                    return (
                      <tr key={func}>
                        <td>{func}</td>
                        <td>{this.state.functions[func]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

        </Dash>
      </div>
    );
  }
}

export default withRouter(Exchange)