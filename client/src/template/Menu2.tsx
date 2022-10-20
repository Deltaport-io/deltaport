import React, { Component } from 'react';
import { withRouter } from 'react-router'
import AppMenu from './Menu'

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
      menuExtended: true,
      open: true
    }
  }

  extendMenu () {
    this.setState({menuExtended: !this.state.menuExtended})
  }

  render() {
    return (
      <div className="leftside-menu" style={{width: this.state.menuExtended ? 220 : 70}}>
        <div onClick={()=>this.extendMenu()} className="menuOpener" style={{right: this.state.menuExtended ? 0 : -3 }}>
          {this.state.menuExtended ? <i className="uil uil-angle-left"/> : <i className="uil uil-angle-right"/>}
        </div>
        <a className="logo text-center logo-light" href="/">
          <span className="logo-lg">
            {this.state.menuExtended ?
              <img src="/logo-big.png" alt="logo" height="32"/> :
              <img src="/logo-only.png" alt="logo" height="32"/>
            }
          </span>
        </a>
        <div className="menuScroll">
          <AppMenu menuExtended={this.state.menuExtended}/>
        </div>
      </div>
    )
  }
}

export default withRouter(Menu)