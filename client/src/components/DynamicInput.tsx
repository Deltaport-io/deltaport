import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Dropdown, DropdownButton } from 'react-bootstrap'

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

  render() {
    let conditionsFullfiled = true
    for(const key in this.props.entry.conditions){
      if(this.props.entry.conditions[key] !== this.props.inputObj[key]){
        conditionsFullfiled = false
        break
      }
    }
    return (
      <>
        {
          this.props.entry.type === 'walletSelect' ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <DropdownButton
                  title={this.props.inputObj[this.props.entry.id] && this.props.wallets.length > 0 ? this.props.wallets.find((wallet:any)=> wallet.id === this.props.inputObj[this.props.entry.id]).name : 'Select wallet'}
                  size="sm"
                >
                  {this.props.wallets.length === 0 ? <Dropdown.ItemText>Add wallet first</Dropdown.ItemText> : null}
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
          : this.props.entry.type === 'balanceInput' && conditionsFullfiled ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <input
                  type="text"
                  value={this.props.inputObj[this.props.entry.id]}
                  name="amount"
                  onChange={(event: any) => this.props.setState({[this.props.entry.id]: event.currentTarget.value})}
                  className="form-control form-control-sm"
                  placeholder="Amount"
                  required
                />
              </td>
            </tr>
          : this.props.entry.type === 'input' && conditionsFullfiled ?
            <tr>
              <td className="text-end align-middle">{this.props.entry.name}</td>
              <td>
                <input
                  type="text"
                  value={this.props.inputObj[this.props.entry.id]}
                  name="amount"
                  onChange={(event: any) => this.props.setState({[this.props.entry.id]: event.currentTarget.value})}
                  className="form-control form-control-sm"
                  placeholder="Amount"
                  required
                />
              </td>
            </tr>
          : null
        }
      </>
    )
  }
}

export default withRouter(DynamicInput)