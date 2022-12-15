import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { config } from '../config'
import { Modal, Card, Button, Dropdown, DropdownButton } from 'react-bootstrap'

interface DynamicInputProps {
  history: any
  location: any
  match: any
  entry: any
  inputObj: any
  wallets: any
  setState: any
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
    this.selectDefaults()
  }

  selectDefaults = async() => {
    if(this.props.entry.type === 'select' && this.props.inputObj[this.props.entry.id] === undefined){
      this.props.setState({[this.props.entry.id]: this.props.entry.options[0].value})
    }
    if(this.props.entry.type === 'walletSelect' && this.props.inputObj[this.props.entry.id] === undefined && this.props.wallets.length > 0){
      this.props.setState({[this.props.entry.id]: this.props.wallets[0].id})
    }
  }

  componentWillUnmount () {

  }

  componentDidUpdate(prevProps: Readonly<DynamicInputProps>, prevState: Readonly<DynamicInputStates>, snapshot?: any): void {
    console.log('newInputObj', this.props.inputObj)
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
                  title={this.props.inputObj[this.props.entry.id] && this.props.wallets.length > 0 ? this.props.wallets.find((wallet:any)=> wallet.id === this.props.inputObj[this.props.entry.id]).name : ''}
                  size="sm"
                >
                  {this.props.wallets.map((wallet:any) => {
                    return <Dropdown.Item key={wallet.id} onClick={() => this.props.setState({[this.props.entry.id]: wallet.id})}>{wallet.name}</Dropdown.Item>
                  })}
                </DropdownButton>
              </td>
            </tr>
          : this.props.entry.type === 'select' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <DropdownButton
                  title={this.props.inputObj[this.props.entry.id] ? this.props.entry.options.find((option:any)=> option.value === this.props.inputObj[this.props.entry.id]).title : ''}
                  size="sm"
                >
                  {this.props.entry.options.map((option:any)=>{
                    return <Dropdown.Item onClick={() => this.props.setState({[this.props.entry.id]: option.value})}>{option.title}</Dropdown.Item>
                  })}
                </DropdownButton>
              </td>
            </tr>
          : this.props.entry.type === 'balanceInput' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td><input type="text" value={this.props.inputObj[this.props.entry.id]} name="amount" className="form-control form-control-sm" placeholder="Amount" required/></td>
            </tr>
          : null
        }
      </>
    )
  }
}

export default withRouter(DynamicInput)