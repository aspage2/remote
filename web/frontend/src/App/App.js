import React, {useEffect} from 'react';

import styles from "./Style.scss";

import Search from '../Search'
import {Route, Redirect, Switch, Link, BrowserRouter} from "react-router-dom";
import PlaybackControls from "../PlaybackControls";
import Snackbar from "../Snackbar";
import AlbumPage from "../AlbumPage";
import ArtistPage from "../ArtistPage";
import ChannelPage from "../ChannelPage";
import Queue from "../Queue";
import Browse from "../Browse/Browse";
import StatsPage from "../StatusPage";
import CurrentAlbum from "../CurrentAlbum";
import MPDConsole from "../MPDConsole/Component";


export default function App(props) {
    const Nav = () => {
        return <div className={styles.nav}>
            <Link to="/web/search">Search</Link>
            <Link to="/web/browse/genre">Browse</Link>
            <Link to="/web/queue">Queue {props.queueCount ? ` (${props.queueCount})` : ""}</Link>
            <Link to="/web/channels">Channels</Link>
            <Link to="/web/stats">Settings {props.dbUpdating ? " (U)" : ""}</Link>
            <div className={styles.noConnection} style={{display: props.isConnected ? "none" : "block"}}>
                Not Connected
            </div>
            <CurrentAlbum cls={styles.currentAlbum}/>
        </div>
    };
    return <BrowserRouter><React.Fragment>
        <div id={styles["browser-root"]}>
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
                <Route path="/web/stats" component={StatsPage}/>
                <Route path="/web/console" component={MPDConsole}/>
            </Switch>
        </div>
        <PlaybackControls/>
        <Nav/>
        <Snackbar/>
    </React.Fragment></BrowserRouter>
}
