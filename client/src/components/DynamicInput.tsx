import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { config } from '../config'
import { Modal, Card, Button, Dropdown, DropdownButton } from 'react-bootstrap'

interface DynamicInputProps {
  history: any
  location: any
  match: any
  entry: any
  state: any
  wallets: any
}

type DynamicInputStates = {

}

class DynamicInput extends Component <DynamicInputProps, DynamicInputStates> {
  constructor (props: DynamicInputProps) {
    super(props)
    this.state = {

    }
  }

  componentDidMount () {
    // TODO: if type needs info loaded
    // this.loadBot()
  }

  componentWillUnmount () {

  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DynamicInputStates)
  }

  render() {
    return (
      <>
        {
          this.props.entry.type === 'walletSelect' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <DropdownButton
                  // title={activeAccount ? activeAccount.name : ''}
                  title={'kra'}
                  size="sm"
                >
                  {this.props.wallets.map((wallet:any) => {
                    return <Dropdown.Item key={wallet.id} onClick={() => this.setState({wallet:wallet.id})}>{wallet.name}</Dropdown.Item>
                  })}
                </DropdownButton>
              </td>
            </tr>
          : this.props.entry.type === 'select' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <DropdownButton
                  // title={this.state.direction === 0 ? this.props.dexpool.data?.token0?.symbol+' to '+this.props.dexpool.data?.token1?.symbol : this.props.dexpool.data?.token1?.symbol+' to '+this.props.dexpool.data?.token0?.symbol}
                  title={'kra'}
                  size="sm"
                >
                  {this.props.entry.options.map((options:any)=>{
                    return <Dropdown.Item /*onClick={() => this.setState({direction:0}, ()=>{this.swapQuote()})}*/>{options.title}</Dropdown.Item>
                  })}
                </DropdownButton>
              </td>
            </tr>
          : this.props.entry.type === 'balanceInput' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td><input type="text" value={this.props.state[this.props.entry.id]} name="amount" className="form-control form-control-sm" placeholder="Amount" required onChange={this.inputChange}/></td>
            </tr>
          : null
        }
      </>
    )
  }
}

export default withRouter(DynamicInput)