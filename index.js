import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { take, withLatestFrom } from 'rxjs/operators'
import { BehaviorSubject, Subject, of, from } from 'rxjs';

const $keysWithProp = props => Object.entries(props)
    .filter(([k]) => k[k.length - 1] == '$')
    .flatMap(([k, prop]) => k == '$'
        ? Array.isArray(prop)
            ? prop.entries()
            : [[0, prop]]
        : [[k, prop]])

const getCurrentValueIfExists = obs$ => {
    let value = undefined
    obs$.pipe(take(1)).subscribe(v => { value = v }).unsubscribe()
    return value
}

export class Binded extends Component {
    constructor(props) {
        super(props)
        this.subscriptions = {}
        this.state = {}
        $keysWithProp(props).forEach(([key, obs$]) => {
            let value = getCurrentValueIfExists(obs$)
            if (key[key.length - 1] == '$') this.state[key.substring(0, key.length - 1)] = value
            else this.state = { ... this.state, ...value }
        })
    }

    updateSubscriptions(prevProps) {
        const allPrevObs = {}
        $keysWithProp(prevProps).forEach(([key, prevObs$]) => {
            allPrevObs[key] = prevObs$
        })
        $keysWithProp(this.props).forEach(([key, obs$]) => {
            if (allPrevObs[key] == obs$) {
                delete allPrevObs[key]
                return
            }
            if (allPrevObs[key]) {
                this.subscriptions[key].unsubscribe()
                delete allPrevObs[key]
            }
            this.subscriptions[key] = obs$.subscribe(key[key.length - 1] == '$'
                ? v => this.setState(() => ({
                    [key.substring(0, key.length - 1)]: v
                }))
                : obj => this.setState(() => ({ ...obj })))
        })
        Object.keys(allPrevObs).forEach(key => this.subscriptions[key].unsubscribe())
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
