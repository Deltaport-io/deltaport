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

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

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

interface FollowProps {
  history: any,
  location: any,
  match: any
}

type FollowStates = {
  follow: any
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

class Follow extends Component <FollowProps, FollowStates> {

  interval: any

  constructor (props: FollowProps) {
    super(props)
    this.state = {
      follow: {},
      liveUpdates: null
    }
  }

  componentDidMount () {
    this.loadFollow()
    this.activateReload()
  }

  componentWillUnmount () {
    this.disableReload()
  }

  activateReload = () => {
    if (this.state.liveUpdates === null) {
      const interval = setInterval(()=>{ this.loadFollow() }, 1000)
      this.setState({liveUpdates: interval})
    }
  }

  disableReload = () => {
    if (this.state.liveUpdates) {
      clearInterval(this.state.liveUpdates)
      this.setState({liveUpdates: null})
    }
  }

  loadFollow = () => {
    const { id } = this.props.match.params;
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/follows/'+id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          // update
          this.setState({
            follow: json.follow
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
    console.log(rawSeries)
    return {
      xAxis: {
        type: 'category',
      },
      yAxis: {
        type: 'value'
      },
      series: Object.values(rawSeries)
    }
  }

  getOHLCChartOption = (data: any) => {
    const upColor = '#ec0000';
    const upBorderColor = '#8A0000';
    const downColor = '#00da3c';
    const downBorderColor = '#008F28';
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
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          }
        }
      },
      grid: [
        {
          left: '10%',
          right: '10%',
          bottom: 200
        },
        {
          left: '10%',
          right: '10%',
          height: 80,
          bottom: 80
        }
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          // inverse: true,
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
          start: 10,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          bottom: 10,
          start: 10,
          end: 100
        }
      ],
      visualMap: {
        show: false,
        seriesIndex: 1,
        dimension: 6,
        pieces: [
          {
            value: 1,
            color: upColor
          },
          {
            value: -1,
            color: downColor
          }
        ]
      },
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
          name: 'Volumn',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: '#7fbe9e'
          },
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
      <div className="Follow">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Followings', path: '/followings' },
              { label: 'Follow', path: '/follow/'+id, active: true }
            ]}
            title={'Follow'}
          />

          <Card>
            <Card.Body>
              <h4 className="header-title mb-2">{this.state.follow.name}</h4>
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
                    <td>{this.state.follow.name}</td>
                  </tr>
                  <tr>
                    <td>Started</td>
                    <td><Moment format="DD/MM/YYYY kk:mm:ss">{this.state.follow.started}</Moment></td>
                  </tr>
                  <tr>
                    <td>Ended</td>
                    <td>{this.state.follow.ended ? <Moment format="DD/MM/YYYY kk:mm:ss">{this.state.follow.ended}</Moment> : null}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

        </Dash>
      </div>
    );
  }
}

export default Follow;