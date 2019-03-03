import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Observable } from 'rxjs';

const $keysWithProp = props => Object.entries(props)
    .filter(([k]) => k[k.length - 1] == '$')
    .flatMap(([k, prop]) => k == '$'
        ? Array.isArray(prop)
            ? prop.entries()
            : [[0, prop]]
        : [[k, prop]])

export class Binded extends Component {
    constructor(props) {
        super(props)
        this.subscriptions = {}
    }

    updateSubscription(key, prevObs$, obs$, cb) {
        if (prevObs$ === obs$) return
        if (prevObs$) this.subscriptions[key].unsubscribe()
        if (obs$) this.subscriptions[key] = obs$.subscribe(cb)
    }

    updateSubscriptions(prevProps) {
        const allObs = {}
        $keysWithProp(prevProps).forEach(([key, prevObs$]) => {
            allObs[key] = [prevObs$, null]
        })
        $keysWithProp(this.props).forEach(([key, obs$]) => {
            if (allObs[key]) allObs[key][1] = obs$
            else allObs[key] = [null, obs$]
        })
        Object.entries(allObs).forEach(([key, [prevObs$, obs$]]) =>
            this.updateSubscription(key, prevObs$, obs$,
                key[key.length - 1] == '$'
                    ? (v => this.setState({
                        ...this.state,
                        [key.substring(0, key.length - 1)]: v
                    }))
                    : (obj => this.setState({ ...this.state, ...obj }))
            )
        )
    }

    componentDidMount() {
        this.updateSubscriptions({})
    }

    componentDidUpdate(prevProps) {
        this.updateSubscriptions(prevProps)
    }

    render() {
        return React.createElement(
            this.props['_'],
            { ...this.state, ...this.props },
            this.props.children
        )
    }

    componentWillUnmount() {
        Object.values(this.subscriptions).forEach(sub => sub.unsubscribe())
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
