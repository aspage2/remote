import React, {useState} from 'react';

import _ from 'lodash';
import classnames from "classnames";
import axios from 'axios';

import styles from './Style.scss';
import {albumArtUrl} from "../urls";
import {SocketContext} from "../socket";

const AlbumItem = ({album, albumartist, onClick}) => <div className={classnames(styles.item, styles.noPadding)}
                                                          onClick={onClick}>
    <img src={albumArtUrl({album, albumartist})}/>
    <div>
        {album}<br/>
        <b>{albumartist}</b>
    </div>
</div>;


const TrackItem = ({album, title, artist, add}) =>
    <div className={styles.item}>
        <div>
            {title}<br/>
            <b>{artist} - {album}</b>
        </div>
        <button onClick={add}>Add</button>
    </div>;

class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: "",
            loaded: true,
            err: false,
            results: null,
        };
        this.timeoutId = null;
        this.searchref = React.createRef();
    }

    handleChange(event) {
        this.setState({
            query: event.target.value
        });
        if (this.timeoutId)
            clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.handleTimeout.bind(this), 300);
    }

    handleTimeout() {
        const query = this.state.query;
        if (query.length < 4)
            return;
        this.setState({
            loaded: false
        }, () => {
            axios.get(`/search?query=${encodeURIComponent(query)}`)
                .then(res => {
                    this.setState({
                        loaded: true,
                        err: false,
                        results: res.data.results
                    })
                })
        })
    }

    componentDidMount() {
        this.searchref.current.focus()
    }

    render() {
        const {query, loaded, err, results} = this.state;
        const {history, socket} = this.props;

        return <React.Fragment>
            <input
                placeholder="Search..."
                size={42}
                className={styles.mainInput}
                type="text"
                onChange={this.handleChange.bind(this)}
                value={query}
                ref={this.searchref}
            /><br/>
            {loaded && results && <div>
                <div className={styles.column}>
                    <h3>Artists</h3>{
                    _.map(results.artist, ({artist}) => <div
                        className={styles.item}
                        onClick={() => history.push(`/web/artist/${artist}`)}
                    >{artist}</div>)
                }
                </div>
                <div className={styles.column}>
                    <h3>Albums</h3>
                    {_.map(results.album, ({album, albumartist}) => <AlbumItem
                            album={album}
                            albumartist={albumartist}
                            onClick={() => {
                                history.push(`/web/albumartist/${albumartist}/album/${album}`)
                            }}
                        />
                    )}
                </div>
                <div className={styles.column}>
                    <h3>Tracks</h3>{
                    _.map(results.track, ({title, album, track, albumartist, artist}) => <TrackItem
                        title={title}
                        album={album}
                        artist={artist}
                        add={() => {
                            socket.emit("findadd", {album, albumartist, track})
                        }}
                        />
                    )
                }</div>
            </div>}
            {loaded && err && <h1>Error.</h1>}
            {!loaded && <h1>loading...</h1>}
        </React.Fragment>;
    }
}

export default props => <SocketContext.Consumer>
    {socket => <Search socket={socket} {...props}/>}
</SocketContext.Consumer>