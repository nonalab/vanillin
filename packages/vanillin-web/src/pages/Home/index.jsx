import React, {PureComponent} from 'react';

import styled from 'styled-components';


import Footer from 'sections/Footer';

import {LongPage} from 'utils/Layout';

const Container = styled(LongPage)`
	justify-content: space-between;
	align-items: center;
	background: #1b1c1d;
`

export default class Home extends PureComponent {
    render() {
        return (<Container>
            <Footer/>
        </Container>);
    }
}
