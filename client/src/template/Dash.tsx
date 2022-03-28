import React, { Component } from 'react'
import { withRouter } from 'react-router'
import SimpleBar from 'simplebar-react'
import { Container, Row, Col } from 'react-bootstrap'
import AppMenu from './Menu'

interface DashProps {
  history: any,
  location: any,
  match: any
}

type DashStates = {
  dropdownOpen: boolean
  leftMenuOpen: boolean
}

class Dash extends Component <DashProps, DashStates> {

  constructor (props: DashProps) {
    super(props)
    this.state = {
      dropdownOpen: false,
      leftMenuOpen: false
    }
  }

  toggleDropdown = () => {
    this.setState({dropdownOpen: !this.state.dropdownOpen})
  }

  openMenu = () => {
    console.log('open')
  }

  logout = () => {
    localStorage.removeItem('accounts')
    this.props.history.push('/')
  }

  render () {
    return (
      <>
        <div className="wrapper">
          <div className="leftside-menu">
            <a className="logo text-center logo-light" href="/">
              <span className="logo-lg">
                <img src="/logo-big.png" alt="logo" height="32"/>
              </span>
            </a>
            <SimpleBar style={{ maxHeight: '100%', overflow: 'scroll' }} scrollbarMaxSize={320}>
              <>
                <AppMenu/>
                <div className="clearfix" />
              </>
            </SimpleBar>
          </div>
          <div className="content-page" style={{paddingTop:0}}>
            <div className="content">
              <Container fluid>
                {this.props.children}
              </Container>
            </div>
            <footer className="footer" style={{borderTop:'none'}}>
              <div className="container-fluid">
                <Row>
                  <Col md={6}>
                    <div className="footer-links d-none d-md-block">
                      <a target="_blank" rel="noreferrer" href="https://deltaport.io">Deltaport.io <i className="uil uil-external-link-alt"></i></a>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="text-md-end footer-links d-none d-md-block">
                      <a target="_blank" rel="noreferrer" href="https://github.com/Deltaport-io/deltaport">Github <i className="uil uil-external-link-alt"></i></a>
                      <a target="_blank" rel="noreferrer" href="https://github.com/Deltaport-io/deltaport/issues">Support <i className="uil uil-external-link-alt"></i></a>
                      <a target="_blank" rel="noreferrer" href="mailto:contact@deltaport.io">Contact <i className="uil uil-external-link-alt"></i></a>
                    </div>
                  </Col>
                </Row>
              </div>
              </footer>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(Dash);