import React, {Fragment, PureComponent} from 'react';

import styled from 'styled-components';

import VanillinFacilitator from 'vanillin-facilitator';

import AccountInfo from 'sections/AccountInfo';
import ConnectionLobby from 'sections/ConnectionLobby';
import Conversation from 'sections/Conversation';
import Setting from 'sections/Setting';
import Footer from 'sections/Footer';

import {LongPage} from 'utils/Layout';

const Container = styled(LongPage)`
justify-content: space-between;
align-items: center;
background: #1b1c1d;
`

export default class Home extends PureComponent {
    state = {
        connected: false
    }

    constructor(props) {
        super(props)

        this.facilitator = new VanillinFacilitator({web3Provider: window.web3.currentProvider})
        this
            .facilitator
            .init()

        this
            .facilitator
            .on('connect', () => this.setState({
                connected: true,
            }))
            .on('error', console.error)
    }

    render() {
        return (<Container>
            <AccountInfo facilitator={this.facilitator}/>
            {
                this.state.connected
                    ?
                    <Conversation facilitator={this.facilitator}/>
                    :
                    <Fragment>
                        <ConnectionLobby facilitator={this.facilitator}/>
                        <Setting facilitator={this.facilitator}/>
                    </Fragment>
            }
            <Footer/>
        </Container>);
    }
}
