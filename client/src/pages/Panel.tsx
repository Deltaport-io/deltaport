import React, { Component } from 'react';
import { Card } from 'react-bootstrap'
import Dash from '../template/Dash'
import PageTitle from '../template/PageTitle'
import { config } from '../config'

interface PanelProps {
  history: any,
  location: any,
  match: any
}

type PanelStates = {
  upcoming: any[]
  news: any[]
  updates: any[]
}

class Panel extends Component <PanelProps, PanelStates> {

  constructor (props: PanelProps) {
    super(props)
    this.state = {
      upcoming: [],
      news: [],
      updates: []
    }
  }

  componentDidMount () {
    this.loadNews()
    this.loadUpdates()
    this.loadPromoted()
  }

  loadNews = () => {
    fetch(
      config.app.baseUri + '/api/v1/news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            upcoming: json.upcoming,
            news: json.news
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  loadUpdates = () => {
    fetch(
      config.app.baseUri + '/api/v1/updates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            updates: json.updates
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  loadPromoted = () => {
    fetch(
      config.app.baseUri + '/api/v1/promoted', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => { return response.json() })
      .then((json) => {
        if (json.status === 'success') {
          localStorage.setItem('promoted', JSON.stringify({
            promoexchanges: json.promoexchanges,
            promopairs: json.promopairs
          }))
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    return (
      <div className="Panel">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Panel', path: '/panel', active: true },
            ]}
            title={'Panel'}
          />
          <div className="row">
            <div className="col-6">
              { this.state.upcoming.length > 0 ?
                <Card>
                  <Card.Body>
                    <h4 className="header-title mb-1">Upcoming</h4>
                    {this.state.upcoming.length === 0 ? 
                    <div className="d-flex mt-3">
                      Loading...
                    </div>
                    : null }
                    {this.state.upcoming.map((item: any, index: number) => {
                      return (
                        <div key={index} className="d-flex mt-3">
                          <i className="uil uil-arrow-growth me-2 font-18 text-primary"></i>
                          <div>
                            <a className="mt-1 font-14" href={item.link} target="_blank" rel="noreferrer">
                              <strong>{item.title}: </strong>
                              <span className="text-muted">{item.desc}</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </Card.Body>
                </Card>
              : null }
              { this.state.news.length > 0 ?
                <Card>
                  <Card.Body>
                    <h4 className="header-title mb-1">News</h4>
                    {this.state.news.length === 0 ? 
                    <div className="d-flex mt-3">
                      Loading...
                    </div>
                    : null }
                    {this.state.news.map((item: any, index: number) => {
                      return (
                        <div key={index} className="d-flex mt-3">
                          <i className="uil uil-arrow-growth me-2 font-18 text-primary"></i>
                          <div>
                            <a className="mt-1 font-14" href={item.link} target="_blank" rel="noreferrer">
                              <strong>{item.title}: </strong>
                              <span className="text-muted">{item.desc}</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </Card.Body>
                </Card>
              : null }
            </div>
            <div className="col-6">
              <Card>
                <Card.Body>
                  <h4 className="header-title">Donate</h4>
                  <div>Bitcoin: <span className="font-monospace">bc1qlml528etlawyqwsnsraysr4qed92q22xxkpu7w</span></div>
                  <div>Ethereum: <span className="font-monospace">0x7Cd4DFA825C9A4e93BD076F0920942Cf60DF65e1</span></div>
                  <h4 className="header-title mb-3 mt-4">Deltaport updates</h4>
                  {this.state.updates.length === 0 ? <p>Loading...</p> : null}
                  {this.state.updates.map((item: any) => {
                    return (
                      <div key={item.id}>
                        <h5>{item.version} - {item.title}</h5>
                        <p className="text-muted mb-2">
                          {item.update}
                        </p>
                      </div>
                    )
                  })}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Dash>
      </div>
    );
  }
}

export default Panel;