import React, {
    PureComponent
} from 'react';

import VanillinFacilitator from 'vanillin-facilitator';

import styled from 'styled-components';

import Conversation from 'sections/Conversation';

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
                <Conversation facilitator={this.facilitator}/>
                <Footer/>
            </Container>
        );
    }
}
