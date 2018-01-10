import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {palette} from 'styled-theme';
import hashAvatar from 'hash-avatar'

import InputSubmit from 'react-input-submit';

import {Comment} from 'semantic-ui-react';

import {FlexColumnSection} from 'utils/Layout';

import ChatMessage from 'components/ChatMessage';

const Container = styled(FlexColumnSection)`
    width: 100vw;
    background-color: ${palette(0)};
    color: ${palette('grayscale', 0, true)};
`;

const StyledInputSubmit = styled(InputSubmit)`
    padding: 1em;

`;

const StyledCommentGroup = styled(Comment.Group)`
    padding-bottom: 90px;
    height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
`;

export default class Conversation extends PureComponent {
    static defaultProps = {
        palette: 'grayscale'
    };

    state = {
        convo: [],
        avatars: {}
    }

    constructor(props) {
        super(props)

        props
            .facilitator
            .on('ready', this.init)
            .on('connect', this.connect)
            .on('message', this.addMessage)
    }

    init = () => {
        const {avatars} = this.state;
        const {accountAddress} = this.props.facilitator;

        avatars[accountAddress] = hashAvatar(accountAddress, {size: 90})

        this.setState({avatars});
    }

    connect = () => {
        const {avatars} = this.state;
        const {otherAddress} = this.props.facilitator;

        avatars[otherAddress] = hashAvatar(otherAddress, {size: 90})

        this.setState({avatars});
    }

    addMessage = (message) => {
        const {convo} = this.state;

        convo.unshift(message);

        this.setState({convo});
    }

    sendMessage = (text) => {
        this
            .props
            .facilitator
            .send({type: 'message', name: this.props.facilitator.accountAddress, text})
    }

    render() {
        return (<Container palette={this.props.palette} id='Conversation'>
            <StyledCommentGroup>
                {
                    this
                        .state
                        .convo
                        .map((item, index) => <ChatMessage key={index} {...item} img={this.state.avatars[item.name]}/>)
                }
            </StyledCommentGroup>
            <StyledInputSubmit
                palette='primary'
                placeholder='Message ...'
                onSubmit={this.sendMessage}
                buttonText='SEND'
            />        
        </Container>);
    }
}
