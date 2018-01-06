import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {palette} from 'styled-theme';

import {Segment, Header} from 'semantic-ui-react';

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

export default class Conversation extends PureComponent {

    state = {
        accountAddress: null
    }

    static defaultProps = {
        palette: 'grayscale'
    };

    constructor(props) {
        super(props)

        props
            .facilitator
            .on('ready', this.init)
            .on('signal', console.log)
            .on('connect', console.log)
            .on('data', console.log)
    }

    connect = () => {}

    init = () => {
        const {accountAddress} = this.props.facilitator;
        this.setState({accountAddress});
    }

    render() {
        return (<Container palette={this.props.palette} id='Conversation'>
            <Segment inverted={true}>
                <Header as='h3' floated='left' color='green'>Your address:</Header>
                <Header as='h3' floated='right' color='teal'>{this.state.accountAddress}</Header>
            </Segment>

            <StyledInputSubmit
                palette='primary'
                placeholder='Enter Recipent ETH Address'
                onSubmit={(address) => this.props.facilitator.sendInvite(address)}
                buttonText='SEND'/>

        </Container>);
    }
}
