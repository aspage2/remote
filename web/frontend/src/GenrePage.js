
import React from 'react';
import _ from 'lodash';

import ListPage from "./ListPage/Component";

export default function GenrePage(props){
    const {match} = props;
    const genreName = decodeURIComponent(match.params.genre);

    return <ListPage
        title={`Artists in ${genreName}`}
        endPoint={`/data/genre/${encodeURIComponent(genreName)}`}
        listTransform={data => _.map(data.artists, name => ({
            route: `/web/artist/${encodeURIComponent(name)}`,
            name: name
        }))}
    />;
}