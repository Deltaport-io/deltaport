import React, { Component } from 'react'
import { withRouter } from 'react-router'
import Dash from '../template/Dash'
import { config } from '../config'
import AceEditor from "react-ace";
import { Modal, Card, Button } from 'react-bootstrap'
import { getCredentials } from '../credcontrols'
import PageTitle from '../template/PageTitle'

import "ace-builds/src-noconflict/mode-javascript" 
import "ace-builds/src-noconflict/theme-github" 
import "ace-builds/src-noconflict/snippets/javascript"

interface BotProps {
  history: any,
  location: any,
  match: any
}

type BotStates = {
  code: string
  name: string
  errors: any
  tradingname: string
  tradingmodal: boolean
  tradingerror: string
  backtestname: string
  backtestmodal: boolean
  backtesterror: string
}

class Bot extends Component <BotProps, BotStates> {
  constructor (props: BotProps) {
    super(props)
    this.state = {
      code: 
`// loading
loader = {
    exchanges: [{
        exchange: 'BitmexLive',
        pairs: [{
            pair: 'ETH/USD',
            timeframe: '1m',
            start: '2022/01/01 00:00:00',
            end: '2022/02/01 00:00:00'
        }],
        balances: [{
            currency: 'BTC',
            amount: 10
        }]
    }],
    ethereum: [{
        wallet: 'MyWallet',
        balances: [{
            currency: 'ETH',
            amount: 100
        },{
            currency: '0x567eb615575d06917efb8e92f1f754cdcf9b57d1',
            amount: 1000
        }]
    }]
}

// define variables

onStart = async() => {
  // execute on start
  await console.log('on start')
}

onTick = async(ticks) => {
  // execute each tick
  await console.log('on tick', ticks)
}

onEnd = async() => {
  // execute on end
  await console.log('on end')
}`,
      name: '',
      errors: {},
      tradingname: '',
      backtestname: '',
      tradingmodal: false,
      backtestmodal: false,
      tradingerror: '',
      backtesterror: ''
    }
  }

  componentDidMount () {
    this.loadBot()
  }

  loadBot = () => {
    const { id } = this.props.match.params;
    const { token } = getCredentials()
    if (id === 'new') {
      return
    }
    fetch(
      config.app.apiUri + '/api/v1/bots/'+id, {
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
            code: json.bot.code,
            name: json.bot.name
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  componentWillUnmount () {

  }

  onChange = (newCode: string) => {
    this.setState({
      code: newCode
    });
  }

  openTradingModal = () => {
    this.setState({
      tradingmodal: true
    })
  }

  closeTradingModal = () => {
    this.setState({
      tradingmodal: false,
      tradingerror: ''
    })
  }

  openBacktestModal = () => {
    this.setState({
      backtestmodal: true
    })
  }

  closeBacktestModal = () => {
    this.setState({
      backtestmodal: false,
      backtesterror: ''
    })
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as BotStates)
  }

  save = (event: any) => {
    event.preventDefault()
    let { id } = this.props.match.params;
    if (id === 'new') {
      id = ''
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/bots/'+id, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          code: this.state.code,
          name: this.state.name
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({errors: {}})
          if (id === '') {
            this.props.history.push('/bots/'+json.id)
          }
        } else {
          this.setState({errors: json.errors})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  runTrading = () => {
    this.setState({tradingerror: ''})
    let { id } = this.props.match.params;
    if (id === 'new') {
      alert('save first')
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/tradings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          id,
          name: this.state.tradingname
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.closeTradingModal()
        } else {
          this.setState({tradingerror: json.message})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  runBacktest = () => {
    this.setState({backtesterror: ''})
    let { id } = this.props.match.params;
    if (id === 'new') {
      alert('save first')
    }
    const { token } = getCredentials()
    fetch(
      config.app.apiUri + '/api/v1/backtests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({
          id,
          name: this.state.backtestname
        })
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.closeBacktestModal()
        } else {
          this.setState({backtesterror: json.message})
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    let { id } = this.props.match.params
    return (
      <div className="Bot">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Bots', path: '/bots' },
              { label: 'Bot', path: '/bots/'+id, active: true }
            ]}
            title={'Bot'}
          />
          <Card>
            <Card.Body>
              <h4 className="header-title d-inline-block">
                <input type="text" value={this.state.name} name="name" className={`form-control ${this.state.errors.name ? "form-control-sm is-invalid" : "form-control-sm"}`} placeholder="Bot name" required onChange={this.inputChange}/>
              </h4>
              <div className="d-flex float-end mb-2">
                <button className="btn btn-primary btn-sm" type="submit" onClick={this.save}>Save</button>
                <button className="btn btn-primary btn-sm ms-1" type="submit" onClick={this.openBacktestModal}>Backtest</button>
                <button className="btn btn-primary btn-sm ms-1" type="submit" onClick={this.openTradingModal}>Trade</button>
              </div>
              <form>
                <div style={{height: 'calc(100vh - 288px)',position:'relative'}}>
                  <AceEditor
                    mode="javascript"
                    theme="github"
                    height="100%"
                    width="100%"
                    onChange={this.onChange}
                    value={this.state.code} 
                    setOptions={{ useWorker: false }}
                  />
                </div>
              </form>
            </Card.Body>
          </Card>
        </Dash>
        <Modal show={this.state.tradingmodal} onHide={this.closeTradingModal} animation={false} centered>
          <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Modal.Title>Start trading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="ps-3 pe-3">
              <div className="mb-2">
                <label className="form-label">Session name</label>
                <input type="text" className="form-control" name="tradingname" value={this.state.tradingname} onChange={this.inputChange} placeholder="Session name"/>
              </div>
              { this.state.tradingerror !== ''
                ? <div className="alert alert-danger alerterror text-center">
                  {this.state.tradingerror}
                </div>
                : null
              }
            </form>
            <div className="mb-1 text-center">
              <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.runTrading()}>Start trading</Button>
            </div>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.backtestmodal} onHide={this.closeBacktestModal} animation={false} centered>
          <Modal.Header style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Modal.Title>Start Backtest</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="ps-3 pe-3">
              <div className="mb-2">
                <label className="form-label">Session name</label>
                <input type="text" className="form-control" name="backtestname" value={this.state.backtestname} onChange={this.inputChange} placeholder="Session name"/>
              </div>
              { this.state.backtesterror !== ''
                ? <div className="alert alert-danger alerterror text-center">
                  {this.state.backtesterror}
                </div>
                : null
              }
            </form>
            <div className="mb-1 text-center">
              <Button className="btn btn-primary account-button" type="submit" onClick={()=>this.runBacktest()}>Start backtest</Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    )
  }
}

export default withRouter(Bot)