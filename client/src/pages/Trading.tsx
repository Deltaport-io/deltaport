import React, { Component } from 'react';
import Dash from '../template/Dash'
import { config } from '../config'
import { getCredentials } from '../credcontrols'
import AceEditor from "react-ace";
import { Card, Table } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Moment from 'react-moment'
import moment from 'moment'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { CandlestickChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  ToolboxComponent,
  TooltipComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  DatasetComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// include required
echarts.use(
  [
    TitleComponent,
    TooltipComponent,
    GridComponent,
    CandlestickChart,
    LineChart,
    CanvasRenderer,
    BarChart,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent,
    DatasetComponent
  ]
);

interface TradingProps {
  history: any,
  location: any,
  match: any
}

type TradingStates = {
  tradesession: any
  data: any
  graphs: any
  graphKeys: any,
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

class Trading extends Component <TradingProps, TradingStates> {

  interval: any

  constructor (props: TradingProps) {
    super(props)
    this.state = {
      tradesession: {},
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
            data[ohlc.source].push({
              ...ohlc,
              timestamp: moment(parseInt(ohlc.timestamp)).format('YYYY-MM-DD HH:mm:ss')
            })
          }
          // process graphs
          const graphs: any = {}
          const graphKeys: any = {}
          for (const graph of json.graphs) {
            // graph data
            if (graphs[graph.graph] === undefined) {
              graphs[graph.graph] = []
            }
            graphs[graph.graph].push({key: graph.key, value: graph.value, timestamp: parseInt(graph.timestamp)})
            // graph keys
            if (graphKeys[graph.graph] === undefined) {
              graphKeys[graph.graph] = []
            }
            if (graphKeys[graph.graph].indexOf(graph.key) !== -1) {
              graphKeys[graph.graph].push(graph.key)
            }
          }
          // update
          this.setState({
            data,
            logs: json.logs,
            tradesession: json.tradesession,
            graphs,
            graphKeys
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }


  getGraphOption = (data: any) => {
    const rawSeries: any = {}
    for (const entry of data) {
      if (rawSeries[entry.key]) {
        rawSeries[entry.key].data.push([entry.timestamp, entry.value])
      } else {
        rawSeries[entry.key] = {
          name: entry.key,
          type: 'line',
          data: [[entry.timestamp, entry.value]]
        }
      }
    }
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      grid: [{
        left: 60,
        right: 5,
        top: '7%',
        bottom: '7%'
      }],
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value'
      },
      series: Object.values(rawSeries)
    }
  }

  getOHLCChartOption = (data: any) => {
    const upColor = colors[2]
    const upBorderColor = colors[2]
    const downColor = colors[1]
    const downBorderColor = colors[1]
    return {
      dataset: {
        source: data
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      grid: [
        {
          left: 60,
          right: 5,
          height: 180,
          bottom: 100
        },
        {
          left: 60,
          right: 5,
          height: 25,
          bottom: 50
        }
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        },
        {
          type: 'category',
          gridIndex: 1,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          bottom: 10,
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          type: 'candlestick',
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upBorderColor,
            borderColor0: downBorderColor
          },
          encode: {
            x: 'timestamp',
            y: ['open', 'close', 'high', 'low']
          }
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: '#6c757d'
          },
          barWidth: '50%',
          large: true,
          encode: {
            x: 'timestamp',
            y: 'volume'
          }
        }
      ]
    }
  }


  render () {
    const { id } = this.props.match.params
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
              <div className="d-flex justify-content-between">
                <h4 className="header-title">{this.state.tradesession.name}</h4>
                <div className="me-1 btn-group">
                  <button onClick={()=>this.setState({viewGraphs: this.state.viewGraphs ? false : true})} type="button" className={this.state.viewGraphs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Graphs</button>
                  <button onClick={()=>this.setState({viewCharts: this.state.viewCharts ? false : true})} type="button" className={this.state.viewCharts ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Charts</button>
                  <button onClick={()=>this.setState({viewCode: this.state.viewCode ? false : true})} type="button" className={this.state.viewCode ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Code</button>
                  <button onClick={()=>this.setState({viewLogs: this.state.viewLogs ? false : true})} type="button" className={this.state.viewLogs ? "btn btn-sm btn-primary" : "btn btn-sm btn-light"}>Logs</button>
                </div>
              </div>
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
                    <td><Moment format="DD/MM/YYYY kk:mm:ss">{this.state.tradesession.started}</Moment></td>
                  </tr>
                  <tr>
                    <td>Ended</td>
                    <td>{this.state.tradesession.ended ? <Moment format="DD/MM/YYYY kk:mm:ss">{this.state.tradesession.ended}</Moment> : null}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {this.state.viewCharts ? Object.keys(this.state.data).map((source: any) => {
            return <Card key={source}>
              <Card.Body>
                <h4 className="header-title d-inline-block mb-2">{source}</h4>
                <ReactEChartsCore
                  echarts={echarts}
                  option={this.getOHLCChartOption(this.state.data[source])}
                  notMerge={true}
                  lazyUpdate={true}
                  theme={"theme_name"}
                />
              </Card.Body>
            </Card>
          }): null}

          {this.state.viewGraphs ? Object.keys(this.state.graphs).map((graph: string) => {
            return <Card key={graph}>
              <Card.Body>
                <h4 className="header-title d-inline-block mb-2">{graph}</h4>
                <ReactEChartsCore
                  echarts={echarts}
                  option={this.getGraphOption(this.state.graphs[graph])}
                  notMerge={true}
                  lazyUpdate={true}
                  theme={"theme_name"}
                />
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
                <Table striped className="mb-0 logtable" size="sm">
                  <thead>
                  <tr>
                    <th style={{width: 170}}>Time</th>
                    <th style={{width: 50}}>Type</th>
                    <th>Log</th>
                  </tr>
                  </thead>
                  <tbody>
                    {this.state.logs.map((log:any) => {
                      return (
                        <tr key={log.id}>
                          <td><Moment format="DD/MM/YYYY kk:mm:ss">{log.timestamp}</Moment></td>
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