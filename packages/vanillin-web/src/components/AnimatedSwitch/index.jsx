import React from 'react';
import {Switch} from 'react-router-dom';
import Animated from 'react-dom-animated';

export default class AnimatedSwitch extends Switch {
    constructor(props) {
        super(props);
        const animate = new Animated.Value(0);
        animate.addListener(this.onAnimate);
        this.state = {
            display: 'block',
            animate
        };
    }

    onAnimate = ({value}) => {
        const newState = (value > 0.99)
            ? {
                display: 'inline'
            }
            : {
                display: 'block'
            };
        this.setState(newState);
    };

    componentWillMount() {
        setTimeout(() => Animated.spring(this.state.animate, {toValue: 1}).start(), 450);
    }

    componentWillReceiveProps() {
        setTimeout(() => Animated.spring(this.state.animate, {toValue: 1}).start(), 450);
        Animated
            .spring(this.state.animate, {toValue: 0.5})
            .start();
    }
    render() {
        const style = {
        display: this.state.display,
            opacity: Animated.template `${this.state.animate}`,
            transform: Animated
                .template `
		scale(${this
                .state
                .animate
                .interpolate({
                    inputRange: [
                        0, 1
                    ],
                    outputRange: ['1.08', '1']})})
					`
                };

                return <Animated.div style={style}>{super.render()}</Animated.div>;
            }
    }
