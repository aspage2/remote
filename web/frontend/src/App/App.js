import React from 'react';

import Search from '../Search'
import {BrowserRouter as Router, Route, Redirect, Switch, Link} from "react-router-dom";
import "./App.css";
import PlaybackControls from "../PlaybackControls";
import Snackbar from "../Snackbar";
import AlbumPage from "../AlbumPage";
import ArtistPage from "../ArtistPage";
import ChannelPage from "../ChannelPage";
import Queue from "../Queue";
import Browse from "../Browse/Browse";
import GenrePage from "../GenrePage";
import StatsPage from "../StatusPage";

export default function App(props) {
    return <Router>
        <React.Fragment>
            <header>
                <Link to="/web/search">Search</Link>
                <Link to="/web/browse/genre">Browse</Link>
                <Link to="/web/queue">Queue {props.queueCount ? ` (${props.queueCount})` : ""}</Link>
                <Link to="/web/channels">Channels</Link>
                <Link to="/web/stats">Settings {props.dbUpdating ? " (U)" : ""}</Link>
            </header>
            <div id="browser-root">
                <Switch>
                    <Route exact path="/web" render={() => <Redirect to={'/web/search'}/>}/>
                    <Route path="/web/search" component={Search}/>
                    <Route path="/web/browse" component={Browse}/>
                    <Route path="/web/channels" component={ChannelPage}/>
                    <Route path="/web/artist/:artist" render={
                        ({match, history}) => <ArtistPage history={history} {...match.params}/>}/>
                    <Route path="/web/albumartist/:albumartist/album/:album" render={
                        ({match}) => <AlbumPage {...match.params}/>
                    }/>
                    <Route path="/web/queue" component={Queue}/>
                    <Route path="/web/genre/:genre" component={GenrePage}/>
                    <Route path="/web/stats" component={StatsPage}/>
                </Switch>
            </div>
            <PlaybackControls/>
            <Snackbar/>
        </React.Fragment>
    </Router>
}
