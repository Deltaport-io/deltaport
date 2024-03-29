import React, { Component } from 'react';
import { withRouter } from 'react-router'
import AppMenu from './Menu'
import isElectron from 'is-electron';

interface MenuProps {
  history: any,
  location: any,
  match: any
}

type MenuStates = {
  menuExtended: boolean
  open: boolean
}

class Menu extends Component <MenuProps, MenuStates> {
  constructor (props: MenuProps) {
    super(props)
    this.state = {
      menuExtended: Boolean(localStorage.getItem('openmenu') && localStorage.getItem('openmenu') === 'close' ? false : true),
      open: true
    }
  }

  extendMenu () {
    const newState = !this.state.menuExtended
    this.setState({menuExtended: newState}, ()=>{
      localStorage.setItem('openmenu', newState ? 'open' : 'close')
    })
  }

  render() {
    return (
      <div className="leftside-menu" style={{width: this.state.menuExtended ? 220 : 70}}>
        <div onClick={()=>this.extendMenu()} className="menu-opener">
          {this.state.menuExtended ? <i className="uil uil-angle-left"/> : <i className="uil uil-angle-right"/>}
        </div>
        <a className="logo text-center logo-light" href="/">
          <span className="logo-lg">
            {this.state.menuExtended ?
              <img src={ isElectron() ? "logo-big-dark.png" : "/logo-big-dark.png"} alt="logo" height="32"/> :
              <img src={ isElectron() ? "logo-only-dark.png" : "/logo-only-dark.png"} alt="logo" height="32"/>
            }
          </span>
        </a>
        <div className="menu-scroll">
          <AppMenu menuExtended={this.state.menuExtended}/>
        </div>
      </div>
    )
  }
}

export default withRouter(Menu)