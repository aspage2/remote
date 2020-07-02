import React from 'react';
import {Route, Switch} from "react-router-dom";

import _ from 'lodash';

import ListPage from "../ListPage/Component";

const ArtistList = () => <h1>Artists</h1>;

function GenreList() {
    return <ListPage
        title="Genres"
        endPoint="/data/genres"
        listTransform={data => _.map(data, name => ({
            name,
            route: `/web/genre/${encodeURIComponent(name)}`
        }))}
    />
}

export default function Browse(props) {
    const {match} = props;
    return <Switch>
        <Route path={`${match.path}/artist`} component={ArtistList}/>
        <Route path={`${match.path}/genre`} component={GenreList}/>
    </Switch>
}
