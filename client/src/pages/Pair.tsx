import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { StockChart } from "../StockChart";
import { DropdownButton, Dropdown } from 'react-bootstrap'
import {
  withDeviceRatio,
  withSize
} from "react-financial-charts";
import { withAPIData } from "../WithAPIData"
import { Card, Table } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import DatePicker from 'react-datepicker';

interface PairProps {
  history: any,
  location: any,
  match: any
}

type PairStates = {
  pair: any
  data: any[]
  balances: any[]
  positions: any[]
  orders: any[]
  timeframe: string
  timeframes: any[]
  start: any
  end: any
  price: string
  amount: string
  side: string
  type: string
  error: string
  success: string
  formLoading: boolean
  isLoading: boolean
}

class Pair extends Component <PairProps, PairStates> {

  constructor (props: PairProps) {
    super(props)
    this.state = {
      pair: {},
      data: [],
      balances: [],
      positions: [],
      orders: [],
      timeframe: '',
      timeframes: [],
      start: new Date(new Date().setHours(new Date().getHours() - 24 * 1)),
      end: new Date(),
      price: '',
      amount: '',
      side: 'Buy',
      type: 'Market',
      error: '',
      success: '',
      formLoading: false,
      isLoading: false
    }
  }

  componentDidMount () {
    this.loadPair()
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as PairStates)
  }

  loadPair = () => {
    const { id } = this.props.match.params
    const { token } = getCredentials()
    let timeframe = ''
    if (this.state.timeframe !== '') {
      timeframe = 'timeframe='+this.state.timeframe
    } else {
      timeframe = ''
    }
    const start = '&start='+this.state.start.getTime()
    const end = '&end='+this.state.end.getTime()
    fetch(
      config.app.apiUri + '/api/v1/pairs/'+id+'?'+timeframe+start+end, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          console.log('data', json.data)
          this.setState({
            pair: json.pair,
            data: json.data,
            balances: json.balances,
            positions: json.positions,
            timeframes: json.timeframes,
            timeframe: json.timeframe
          })
        } else {
          this.setState({
            pair: {},
            data: [],
            timeframes: []
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  createOrder = (event: any) => {
    event.preventDefault()
    const { id } = this.props.match.params
    const { token } = getCredentials()
    this.setState({error: '', success: '', formLoading: true})
    fetch(
      config.app.apiUri + '/api/v1/pairs/'+id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          amount: this.state.amount,
          price: this.state.price,
          type: this.state.type,
          side: this.state.side
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            type: 'Market',
            side: 'Buy',
            price: '0',
            amount: '0',
            error: '',
            success: json.message,
            formLoading: false
          })
          this.loadPair()
        } else {
          this.setState({error: json.message, formLoading: false})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  switchTimeframe = (timeframe: string) => {
    this.setState({
      timeframe,
      data: [],
      pair: {}
    })
  }

  render () {
    const { id } = this.props.match.params
    const CustomChart = withAPIData(this.state.data)(
      withSize()(withDeviceRatio()(StockChart)),
    )
    return (
      <div className="Pairs">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Pairs', path: '/pairs' },
              { label: 'Pair', path: '/pairs/'+id, active: true }
            ]}
            title={'Pair'}
          />
          <Card>
            <Card.Body>
              <div className="mb-2">
                <h4 className="header-title mb-2 d-inline-block">{this.state.pair ? this.state.pair.pair : ''}</h4>
                <div className="d-flex float-end">
                  <div style={{width: 155, paddingRight: 5, zIndex: 1000}}>
                    <DatePicker
                      className="form-control form-control-sm date"
                      selected={this.state.start}
                      onChange={(date) => this.setState({start: date})}
                      timeFormat="hh:mm a"
                      dateFormat={'MM/dd/yyyy'}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{width: 155, paddingRight: 5, zIndex: 1000}}>
                    <DatePicker
                      className="form-control form-control-sm date"
                      selected={this.state.end}
                      onChange={(date) => this.setState({end: date})}
                      timeFormat="hh:mm a"
                      dateFormat={'MM/dd/yyyy'}
                      autoComplete="off"
                    />
                  </div>
                  <DropdownButton
                    title={ this.state.timeframe ? this.state.timeframe : this.state.timeframes[0] }
                    size="sm"
                  >
                    { this.state.timeframes.map((timeframe:any) => {
                      return <Dropdown.Item onClick={() => this.switchTimeframe(timeframe)}>{timeframe}</Dropdown.Item>
                    })}
                  </DropdownButton>
                  <button onClick={()=>this.loadPair()} className="btn btn-primary btn-sm ms-1">
                    <i className="mdi mdi-autorenew"></i>
                  </button>
                </div>
              </div>
              <div style={{height: 400}}>
                <CustomChart/>
              </div>
            </Card.Body>
          </Card>
          <div className="row">
            <div className="col-md-6">
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
            </div>
            <div className="col-md-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-3">Create order</h4> 
                  <form onSubmit={this.createOrder}>
                    <Table className="mb-0 table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-end align-middle">Type</td>
                          <td>
                            <DropdownButton
                              title={ this.state.type }
                              size="sm"
                            >
                              <Dropdown.Item onClick={() => this.setState({type:'Market'})}>Market</Dropdown.Item>
                              <Dropdown.Item onClick={() => this.setState({type:'Limit'})}>Limit</Dropdown.Item>
                            </DropdownButton>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-end align-middle">Side</td>
                          <td>
                            <DropdownButton
                              title={ this.state.side }
                              size="sm"
                            >
                              <Dropdown.Item onClick={() => this.setState({side:'Buy'})}>Buy</Dropdown.Item>
                              <Dropdown.Item onClick={() => this.setState({side:'Sell'})}>Sell</Dropdown.Item>
                            </DropdownButton>  
                          </td>
                        </tr>
                        { this.state.type === 'Limit' ?
                        <tr>
                          <td className="text-end align-middle">Price</td>
                          <td><input type="text" value={this.state.price} name="price" className="form-control form-control-sm" placeholder="Price" required onChange={this.inputChange}/></td>
                        </tr>
                        : null }
                        <tr>
                          <td className="text-end align-middle">Amount</td>
                          <td><input type="text" value={this.state.amount} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
                        </tr>
                        <tr>
                          <td></td>
                          <td>
                            { this.state.formLoading ?
                              <button className="btn btn-primary btn-sm" type="submit">
                                <div className="spinner-border spinner-border-sm">
                                  <span className="sr-only"></span>
                                </div>
                              </button>
                            :
                              <button className="btn btn-primary btn-sm" type="submit">Create order</button>
                            }
                          </td>
                        </tr>
                        { this.state.success !== '' || this.state.error !== '' ?
                          <tr>
                            <td></td>
                            <td>
                              { this.state.success !== ''
                                ? <div className="alert alert-success mb-0">
                                  {this.state.success}
                                </div>
                                : null
                              }
                              { this.state.error !== ''
                                ? <div className="alert alert-danger mb-0">
                                  {this.state.error}
                                </div>
                                : null
                              }
                            </td>
                          </tr>
                        : null }
                      </tbody>
                    </Table>
                  </form>
                </Card.Body>
              </Card>
            </div>
            <div className="col-12">
              <Card>
                <Card.Body>
                  <h4 className="header-title mb-2">Positions</h4> 
                  <Table striped className="mb-0" size="sm">
                    <thead>
                      <tr>
                        <th>Id</th>
                        <th>Timestamp</th>
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
            </div>
          </div>
        </Dash>
      </div>
    );
  }
}

export default Pair;