import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {FooterContainer} from 'utils/Layout';

import {AUTHORS as authors, LICENSE as license} from 'variables';

const StyledFooter = styled(FooterContainer)`
    line-height: 24px;
    width: 100vw;
    color: white;
    font-size: 1em;
    text-align: center;
    padding: 1.8em;
`;

export default class Footer extends PureComponent {
    render() {
        return (<StyledFooter id='Copyright'>
            <p>
                This site was developed by {
                    authors.map(({
                        name,
                        url
                    }, i) => <span key={i}>
                        <a rel='noopener noreferrer' href={url} target='_blank'>{` ${name}`}</a>{', '}
                    </span>)
                }
                and is licensed under the
                <br/>
                <a className='rainbow mobile' style={{
                        color: 'white'
                    }} rel='noopener noreferrer' target='_blank' href={license.url}>
                    {license.name}
                </a>
            </p>
        </StyledFooter>);
    }
}
