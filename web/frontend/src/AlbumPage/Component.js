import React from 'react';
import {albumArtUrl, timeStr, useMPDQuery} from "../urls";

import toPairs from "lodash/toPairs";
import groupBy from "lodash/groupBy";
import sumBy from "lodash/sumBy";
import maxBy from "lodash/maxBy";
import uniqBy from "lodash/uniqBy";
import map from "lodash/map";


import styles from './Style.scss';
import {mpdQuery, tracksFromData} from "../mpd";

// mostCommonValue returns the value which makes up the majority of
// items in a set.
const mostCommonValue = (l, k) => (
    maxBy(
        toPairs(groupBy(l, k)),
        ([__, vals]) => vals.length
    )
    || [undefined, undefined]
)[0];

export default function AlbumPage({album, albumartist}) {

    const {loaded, err, data} = useMPDQuery(`find albumartist "${albumartist}" album "${album}"`);
    if (!loaded)
        return <div/>;
    if (err)
        return <h3>Error</h3>;

    const tracks = Array.from(tracksFromData(data));

    // Indicates that this is a compilation album, changing what information
    // is displayed on the tracklist
    const multiArtist = uniqBy(tracks, "artist").length > 1;

    // Calculate the duration of this album in hours & minutes
    const runTime = sumBy(tracks, t => parseInt(t.time));
    const runHours = Math.floor(runTime / 3600);
    const runMinutes = Math.floor((runTime % 3600) / 60);

    // If the tracks have different dates, choose the most common one.
    const date = mostCommonValue(tracks, "date");
    const genre = mostCommonValue(tracks, "genre");

    const albumAdd = () => mpdQuery(`findadd album "${album}" albumartist "${albumartist}"`);
    const trackAdd = track => mpdQuery(
        `findadd album "${album}" albumartist "${albumartist}" track ${track}`
    );

    return <React.Fragment>
        <h1>{album}</h1>
        <div className={`${styles.albumInfo} ${styles.column}`}>
            <img alt={album} src={albumArtUrl({albumartist, album})}/><br/><br/>
            <b>{albumartist}</b>{date && ` - ${date}` || ""}<br/>
            {runHours && `${runHours} hr ` || ""}
            {runMinutes && `${runMinutes} min` || ""}<br/>
            <i>Genre: {genre}</i><br/><br/>
            <button className={styles.addAlbum} onClick={albumAdd}>Add Album to Queue</button>
        </div>

        <div className={styles.column}>{map(tracks,
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
