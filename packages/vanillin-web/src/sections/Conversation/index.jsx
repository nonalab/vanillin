import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {palette} from 'styled-theme';

// import InputSubmit from 'react-input-submit';

import {FlexColumnSection} from 'utils/Layout';

const Container = styled(FlexColumnSection)`
    width: 100vw;
    background-color: ${palette(0)};
    color: ${palette('grayscale', 0, true)};
`;

// const StyledInputSubmit = styled(InputSubmit)`
//     padding: 1em;
//
// `;

export default class Conversation extends PureComponent {
    static defaultProps = {
        palette: 'grayscale'
    };

    constructor(props) {
        super(props)

        props
            .facilitator
            .on('signal', console.log)
            .on('connect', console.log)
            .on('data', console.log)
    }

    connect = () => {}

    render() {
        return (<Container palette={this.props.palette} id='Conversation'>

        </Container>);
    }
}
