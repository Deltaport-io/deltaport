import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { StockChart } from "../StockChart";
import {
  withDeviceRatio,
  withSize
} from "react-financial-charts";
import AceEditor from "react-ace";
import { Card, Table } from 'react-bootstrap'
import { withAPIData } from "../WithAPIData"
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

interface TradingProps {
  history: any,
  location: any,
  match: any
}

type TradingStates = {
  tradesession: any
  data: any
  logs: any[]
  viewCharts: boolean
  viewCode: boolean
  viewLogs: boolean
  liveUpdates: any
}

class Trading extends Component <TradingProps, TradingStates> {

  interval: any

  constructor (props: TradingProps) {
    super(props)
    this.state = {
      tradesession: {},
      data: {},
      logs: [],
      viewCharts: false,
      viewCode: false,
      viewLogs: true,
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.loadTrade()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    if (this.state.liveUpdates === null) {
      const interval = setInterval(()=>{ this.loadTrade() }, 1000)
      this.setState({liveUpdates: interval})
    }
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  loadTrade = () => {
    const { id } = this.props.match.params;
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings/'+id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          // process ohlcs
          const data: any = {}
          for (const ohlc of json.ohlcs) {
            if (data[ohlc.source] === undefined) {
              data[ohlc.source] = []
            }
            data[ohlc.source].push(ohlc)
          }
          this.setState({
            data,
            logs: json.logs,
            tradesession: json.tradesession
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    const { id } = this.props.match.params
    const charts = []
    for (const source in this.state.data) {
      const CustomChart = withAPIData(this.state.data[source])(
        withSize({ style: { minHeight: 300 } })(withDeviceRatio()(StockChart)),
      )
      charts.push({source, CustomChart})
    }
    return (
      <div className="Trading">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Trading', path: '/tradings' },
              { label: 'Trading', path: '/tradings/'+id, active: true }
            ]}
            title={'Trading'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.tradesession.name}</h4>
              <Table striped className="mb-0" size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{this.state.tradesession.name}</td>
                  </tr>
                  <tr>
                    <td>Started</td>
                    <td><Moment format="YYYY/MM/DD h:mm:ss A">{this.state.tradesession.started}</Moment></td>
                  </tr>
                  <tr>
                    <td>Ended</td>
                    <td><Moment format="YYYY/MM/DD h:mm:ss A">{this.state.tradesession.ended}</Moment></td>
                  </tr>
                  <tr>
                    <td>Display</td>
                    <td>
                      <div className="mb-2 me-1 btn-group">
                        <button onClick={()=>this.setState({viewCharts: this.state.viewCharts ? false : true})} type="button" className={this.state.viewCharts ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Charts</button>
                        <button onClick={()=>this.setState({viewCode: this.state.viewCode ? false : true})} type="button" className={this.state.viewCode ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Code</button>
                        <button onClick={()=>this.setState({viewLogs: this.state.viewLogs ? false : true})} type="button" className={this.state.viewLogs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Logs</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {this.state.viewCharts ? charts.map((chart) => {
            return <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block mb-2">{chart.source}</h4>
                <div>
                  <chart.CustomChart/>
                </div>
              </Card.Body>
            </Card>
          }): null}

          {this.state.viewCode ?
            <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block">Code</h4>
                <div style={{height: 'calc(100vh - 335px)',position:'relative'}}>
                  <AceEditor
                    mode="javascript"
                    theme="github"
                    height="100%"
                    width="100%"
                    value={this.state.tradesession.code} 
                  />
                </div>
              </Card.Body>
            </Card>
          : null}

          {this.state.viewLogs ?
            <Card>
              <Card.Body>
                <h4 className="header-title d-inline-block">Logs</h4>
                <Table striped className="mb-0" size="sm">
                  <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Log</th>
                  </tr>
                  </thead>
                  <tbody>
                    {this.state.logs.map((log:any) => {
                      return (
                        <tr key={log.id}>
                          <td><Moment format="YYYY/MM/DD h:mm:ss A">{log.timestamp}</Moment></td>
                          <td>{log.type}</td>
                          <td>{log.msg}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          : null}

        </Dash>
      </div>
    );
  }
}

export default Trading;