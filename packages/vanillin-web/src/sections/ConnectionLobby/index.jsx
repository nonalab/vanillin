import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {palette} from 'styled-theme';

import InputSubmit from 'react-input-submit';

import {FlexColumnSection} from 'utils/Layout';

const Container = styled(FlexColumnSection)`
    width: 100vw;
    background-color: ${palette(0)};
    color: ${palette('grayscale', 0, true)};
`;

const StyledInputSubmit = styled(InputSubmit)`
    padding: 1em;

`;

export default class ConnectionLobby extends PureComponent {
    static defaultProps = {
        palette: 'grayscale'
    };

    render() {
        return (<Container palette={this.props.palette} id='ConnectionLobby'>
            <StyledInputSubmit
                palette='primary'
                placeholder='Enter Recipent ETH Address'
                onSubmit={(address) => this.props.facilitator.sendInvite(address)}
                buttonText='SEND'
            />

        </Container>);
    }
}
