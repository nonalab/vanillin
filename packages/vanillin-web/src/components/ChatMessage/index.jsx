import React from 'react'

import {Comment} from 'semantic-ui-react';

export default(props) => {
    return (<Comment>
        <Comment.Avatar as='a' src={props.img}/>
        <Comment.Content>
            <Comment.Author as='a'>{props.name}</Comment.Author>
            <Comment.Text>{props.text}</Comment.Text>
        </Comment.Content>
    </Comment>)
}
