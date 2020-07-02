import React from 'react';
import {albumArtUrl, timeStr, useMusicDatabaseQuery} from "../urls";

import _ from 'lodash';

import styles from './Style.scss';
import {SocketContext} from "../socket";

const mostCommonValue = (l, k) => (
    _.maxBy(
        _.toPairs(_.groupBy(l, k)),
        ([__, vals]) => vals.length
    )
    || [undefined, undefined]
)[0];

function AlbumPage({socket, album, albumartist}) {

    const {loaded, err, data} = useMusicDatabaseQuery(`/data/albumartist/${albumartist}/album/${album}`);
    if (!loaded)
        return <h3>Loading...</h3>;
    if (err)
        return <h3>Error</h3>;

    const tracks = data.tracks || [];

    // Indicates that this is a compilation album, changing what information
    // is displayed on the tracklist
    const multiArtist = _.uniqBy(tracks, "artist").length > 1;

    // Calculate the duration of this album in hours & minutes
    const runTime = _.sumBy(tracks, t => parseInt(t.time));
    const runHours = Math.floor(runTime / 3600);
    const runMinutes = Math.floor((runTime % 3600) / 60);

    // If the tracks have different dates, choose the most common one.
    const date = mostCommonValue(tracks, "date");
    const genre = mostCommonValue(tracks, "genre");

    const albumAdd = () => socket.emit('findadd', {album, albumartist});
    const trackAdd = track => socket.emit('findadd', {album, albumartist, track});

    return <React.Fragment>
        <h1>{album}</h1>
        <div className={`${styles.albumInfo} ${styles.column}`}>
            <img alt={album} src={albumArtUrl({albumartist, album})}/><br/><br/>
            <b>{albumartist}</b>{date && ` - ${date}` || ""}<br/>
            {runHours && `${runHours} hr ` || ""}
            {runMinutes && `${runMinutes} min` || ""}<br/>
            <i>Genre: {genre}</i><br/><br/>
            <button onClick={albumAdd}>Add Album to Queue</button>
        </div>

        <div className={styles.column}>{_.map(tracks,
            (track, i) => <div key={i} className={styles.trackItem}>
                <span className={styles.trackNum}>{track.track}.</span>
                <div className={styles.info}>
                    <span className={styles.title}>{track.title}</span><br/>
                    {multiArtist && <span className={styles.artist}>{track.artist}</span>}
                </div>
                <span className={styles.time}>{timeStr(track.time)}</span>
                <button onClick={() => trackAdd(track.track)}>Add</button>
            </div>
        )}</div>
    </React.Fragment>;
}

export default props => <SocketContext.Consumer>
    {socket => <AlbumPage socket={socket} {...props}/>}
</SocketContext.Consumer>;
