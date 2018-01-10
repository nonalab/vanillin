import React, {
    PureComponent
} from 'react';

import styled from 'styled-components';

import VanillinFacilitator from 'vanillin-facilitator';

import AccountInfo from 'sections/AccountInfo';
import ConnectionLobby from 'sections/ConnectionLobby';
import Conversation from 'sections/Conversation';
import Setting from 'sections/Setting';
import Footer from 'sections/Footer';

import {
    LongPage
} from 'utils/Layout';

const Container = styled(LongPage)`
justify-content: space-between;
align-items: center;
background: #1b1c1d;
`

export default class Home extends PureComponent {
    constructor(props) {
        super(props)

        this.facilitator = new VanillinFacilitator({web3Provider: window.web3.currentProvider})
        this.facilitator.init()

        this.facilitator.on('error', console.error)
    }

    render() {
        return(
            <Container>
                <AccountInfo facilitator={this.facilitator}/>
                <ConnectionLobby facilitator={this.facilitator}/>
                <Conversation facilitator={this.facilitator}/>
                <Setting facilitator={this.facilitator}/>
                <Footer/>
            </Container>
        );
    }
}
