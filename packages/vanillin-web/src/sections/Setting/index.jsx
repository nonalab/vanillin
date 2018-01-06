import React, {PureComponent} from 'react';

import styled from 'styled-components';

import {palette} from 'styled-theme';

import {Segment, Checkbox, Input, Label, Divider} from 'semantic-ui-react';

import {FlexColumnCenterDiv} from 'utils/Layout';

const Container = styled(FlexColumnCenterDiv)`
    width: 100vw;
    background-color: ${palette(0)};
    color: ${palette('grayscale', 0, true)};
`;

export default class Setting extends PureComponent {

    state = {
        watching: false,
        refreshRate: 1800
    }

    static defaultProps = {
        palette: 'grayscale'
    };

    constructor(props) {
        super(props)

        props
            .facilitator
            .on('ready', this.init)
    }

    init = async () => {
        const {facilitator} = this.props;

        await facilitator.startEventWatching()

        this.setState({watching: true,});
    }

    toggleHandshakeWatching= async()=>{
        const {facilitator} = this.props;
        const {watching, refreshRate} = this.state

        await watching
            ? facilitator.stopEventWatching()
            : facilitator.startEventWatching(refreshRate)

        this.setState({
            watching: !watching,
        });
    }

    setRefreshRage=(e, {value})=> this.setState({
        refreshRate: value,
    })

    render() {
        return (<Container palette={this.props.palette} id='Setting'>

            <Segment raised compact color='violet'>
                <Checkbox
                    toggle
                    label='Watching for Handshake'
                    checked={this.state.watching}
                    onChange={this.toggleHandshakeWatching}
                />
                <Divider />
                <Input
                    labelPosition='right'
                    type='number' placeholder='Amount'
                    size='tiny'
                    defaultValue={1800}
                    onChange={this.setRefreshRage}
                    disabled={this.state.watching}>
                    <Label color='purple'>ms</Label>
                    <input/>
                    <Label color='pink' tag>Refresh Rate</Label>
                </Input>
                <Divider />
            </Segment>


        </Container>);
    }
}
