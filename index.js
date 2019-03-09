import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { take } from 'rxjs/operators'

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
        this.state = {}
        $keysWithProp(props).forEach(([key, obs$]) => {
            obs$.pipe(take(1)).subscribe(v => key[key.length - 1] == '$'
                ? this.state = { ...this.state, [key.substring(0, key.length - 1)]: v }
                : this.state = { ... this.state, ...v }).unsubscribe()
        })
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
                    ? v => this.setState(() => ({
                        [key.substring(0, key.length - 1)]: v
                    }))
                    : obj => this.setState(() => ({ ...obj }))
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

export const bindWith = defaultProps => Component => props => React.createElement(
    Binded,
    { ...defaultProps, ...props, "_": Component },
    props.children
)

export const bind = bindWith({})
