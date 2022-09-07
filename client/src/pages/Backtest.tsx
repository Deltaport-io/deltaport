import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import { StockChart } from "../StockChart";
import {
  withDeviceRatio,
  withSize
} from "react-financial-charts";
import { Card, Table } from 'react-bootstrap'
import AceEditor from "react-ace";
import { withAPIData } from "../WithAPIData"
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import moment from 'moment'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

interface BacktestProps {
  history: any,
  location: any,
  match: any
}

type BacktestStates = {
  backtest: any
  data: any
  graphs: any
  graphKeys: any
  logs: any[]
  viewCharts: boolean
  viewGraphs: boolean
  viewCode: boolean
  viewLogs: boolean
  liveUpdates: any
}

const style = getComputedStyle(document.body)
const colors = [
  style.getPropertyValue('--bs-primary'),
  style.getPropertyValue('--bs-danger'),
  style.getPropertyValue('--bs-success'),
  style.getPropertyValue('--bs-warning'),
  style.getPropertyValue('--bs-info')
]

class Backtest extends Component <BacktestProps, BacktestStates> {

  constructor (props: BacktestProps) {
    super(props)
    this.state = {
      backtest: {},
      data: {},
      graphs: {},
      graphKeys: {},
      logs: [],
      viewCharts: false,
      viewGraphs: false,
      viewCode: false,
      viewLogs: true,
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.loadBacktest()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    const interval = setInterval(()=>{ this.loadBacktest() }, 1000)
    this.setState({liveUpdates: interval})
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  loadBacktest = () => {
    const { id } = this.props.match.params;
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests/'+id, {
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
          // process graphs
          const graphs: any = {}
          const graphKeys: any = {}
          for (const graph of json.graphs) {
            // graph data
            if (graphs[graph.graph] === undefined) {
              graphs[graph.graph] = []
            }
            graphs[graph.graph].push({key: graph.key, value: graph.value, timestamp: graph.timestamp})
            // graph keys
            if (graphKeys[graph.graph] === undefined) {
              graphKeys[graph.graph] = []
            }
            if (graphKeys[graph.graph].indexOf(graph.key) === -1) {
              graphKeys[graph.graph].push(graph.key)
            }
          }
          // update
          this.setState({
            data,
            logs: json.logs,
            backtest: json.backtest,
            graphs,
            graphKeys
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
      <div className="Backtest">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Backtests', path: '/backtests' },
              { label: 'Backtest', path: '/backtest/'+id, active: true }
            ]}
            title={'Backtest'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.backtest.name}</h4>
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
                    <td>{this.state.backtest.name}</td>
                  </tr>
                  <tr>
                    <td>Started</td>
                    <td><Moment format="DD/MM/YYYY h:mm:ss A">{this.state.backtest.started}</Moment></td>
                  </tr>
                  <tr>
                    <td>Ended</td>
                    <td>{this.state.backtest.ended ? <Moment format="DD/MM/YYYY h:mm:ss A">{this.state.backtest.ended}</Moment> : null}</td>
                  </tr>
                  <tr>
                    <td>Display</td>
                    <td>
                      <div className="mb-2 me-1 btn-group">
                        <button onClick={()=>this.setState({viewGraphs: this.state.viewGraphs ? false : true})} type="button" className={this.state.viewGraphs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Graphs</button>
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
            return <Card key={chart.source}>
              <Card.Body>
                <h4 className="header-title d-inline-block mb-2">{chart.source}</h4>
                <div>
                  <chart.CustomChart/>
                </div>
              </Card.Body>
            </Card>
          }): null}

          {this.state.viewGraphs ? Object.keys(this.state.graphs).map((graph: string) => {
            return <Card key={graph}>
              <Card.Body>
                <h4 className="header-title d-inline-block mb-2">{graph}</h4>
                <ResponsiveContainer width={'100%'} height={300}>
                  <LineChart data={this.state.graphs[graph]} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="timestamp"
                      tick={{fill: '#6c757d'}}
                      minTickGap={20}
                      tickFormatter={(tick, index)=>{return moment(tick, 'x').format('DD/MM/YYYY HH:mm:ss')}}
                    />
                    <YAxis tick={{fill: '#6c757d'}}/>
                    <Tooltip
                      isAnimationActive={false}
                      labelFormatter={(entry: any)=>{return moment(entry, 'x').format('DD/MM/YYYY HH:mm:ss')}}
                    />
                    {this.state.graphKeys[graph].map((entry: any, index: number) => {
                      return <Line key={entry} dataKey="value" name={entry} dot={false} type="monotone" connectNulls={true} stroke={colors[index % colors.length]} strokeWidth={2}/>
                    })}
                  </LineChart>
                </ResponsiveContainer>
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
                    value={this.state.backtest.code} 
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
                          <td><Moment format="DD/MM/YYYY h:mm:ss A">{log.timestamp}</Moment></td>
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

export default Backtest;