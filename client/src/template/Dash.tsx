import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import Menu2 from './Menu2'

interface DashProps {
  history: any,
  location: any,
  match: any
}

type DashStates = {
}

class Dash extends Component <DashProps, DashStates> {

  constructor (props: DashProps) {
    super(props)
    this.state = {
    }
  }

  render () {
    return (
      <>

        <div className="wrapper main-holder">
          <Menu2/>

          <div style={{width:'100%', display: 'flex', flexDirection: 'column'}}>

            <div className="navbar-custom">
              <div className="container-fluid">
                <ul className="list-unstyled topbar-menu mb-0">
                  <li className="dropdown notification-list">
                    Search
                  </li>
                </ul>
                <ul className="list-unstyled topbar-menu float-end mb-0">
                  <li className="dropdown notification-list">
                    Profile dropdown
                  </li>
                </ul>
                <button className="button-menu-mobile open-left disable-btn" onClick={()=>console.log('kra')}>
                  <i className="mdi mdi-menu" />
                </button>
              </div>
            </div>

            <div className="content-page">
              <div className="content">
                <Container fluid>
                  {this.props.children}
                </Container>
              </div>
              <footer className="footer">
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
        </div>
      </>
    );
  }
}

export default withRouter(Dash);