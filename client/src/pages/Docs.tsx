import React, { Component } from 'react'
import { withRouter } from 'react-router'
import Dash from '../template/Dash'
import { Card } from 'react-bootstrap'
import PageTitle from '../template/PageTitle'
import Markdown from 'markdown-to-jsx'
const mainmd = require('../Main.md')

interface DocsProps {
  history: any,
  location: any,
  match: any
}

type DocsStates = {
  doc: string
}

class Docs extends Component <DocsProps, DocsStates> {
  constructor (props: DocsProps) {
    super(props)
    this.state = {
      doc: ''
    }
  }

  componentDidMount () {
    fetch(mainmd.default)
      .then(response => {
        return response.text()
      })
      .then(text => {
        this.setState({
          doc: text
        })
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render(){
    return (
      <div className="Docs">
        <Dash>
          <PageTitle
            breadCrumbItems={[
              { label: 'Docs', path: '/docs', active: true },
            ]}
            title={'Docs'}
          />
          <Card>
            <Card.Body>
              <Markdown children={this.state.doc}></Markdown>
            </Card.Body>
          </Card>
        </Dash>
      </div>
    ) 
  }
}

export default withRouter(Docs)