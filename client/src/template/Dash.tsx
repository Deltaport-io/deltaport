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
  search: string
  profileOpen: boolean
}

class Dash extends Component <DashProps, DashStates> {

  constructor (props: DashProps) {
    super(props)
    this.state = {
      search: '',
      profileOpen: false
    }
  }

  inputChange = (event: any) => {
    this.setState({ [event.currentTarget.name]: event.currentTarget.value } as DashStates)
  }

  logout = () => {
    localStorage.removeItem('accounts')
    this.props.history.push('/')
  }

  render () {
    return (
      <>
        <div className="wrapper main-holder">
          <Menu2/>
          <div className="content-with-topbar-holder">
            <div className="navbar-custom">
              <div className="topbar-search">
                <form onSubmit={() => {/*this.searchMarketplace*/}} className="me-1">
                  <div className="input-group input-group-sm">
                    <input type="text" className="form-control form-control-sm" name="search" value={this.state.search} onChange={this.inputChange} placeholder=""/>
                    <button className="btn btn-primary" type="submit">Search</button>
                  </div>
                </form>
              </div>
              <div className="topbar-profile">
                <i className="dripicons dripicons-user topbar-usericon" onClick={() => this.setState({profileOpen: !this.state.profileOpen})}/>
                {this.state.profileOpen ?
                  <div className="topbar-profile-dropdown">
                    <div className="icon-holder">
                      <i className="dripicons dripicons-user"/>
                    </div>
                    <div className="topbar-logout" onClick={() => this.logout()}>
                      Logout
                    </div>
                  </div>
                : null}
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