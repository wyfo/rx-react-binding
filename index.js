import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Observable } from 'rxjs';

export class Binded extends Component {
    constructor(props) {
        super(props)
        this.subscriptions = []
    }

    subscribe() {
        for (let [key$, obs] of Object.entries(this.props))
            if (key$[key$.length - 1] == "$" && obs) {
                const key = key$.substring(0, key$.length - 1)
                this.subscriptions.push(
                    obs.subscribe(v => this.setState({ ...this.state, [key]: v }))
                )
            }
        if (this.props.$) {
            const $ = Array.isArray(this.props.$) ? this.props.$ : [this.props.$]
            for (let obs of $) if (obs) {
                this.subscriptions.push(obs.subscribe(obj => {
                    this.setState({ ...this.state, ...obj })
                }))
            }
        }
    }

    unsubscribe() {
        while (this.subscriptions) this.subscriptions.pop().unsubscribe()
    }

    componentDidMount() {
        this.subscribe()
    }

    render() {
        return React.createElement(
            this.props['_'],
            { ...this.state, ...this.props },
            this.props.children
        )
    }

    componentWillUnmount() {
        this.unsubscribe()
    }
}

Binded.propTypes = {
    _: PropTypes.elementType.isRequired,
}

export default Component => props => React.createElement(
    Binded,
    { ...props, "_": Component },
    props.children
)
