import React from 'react';

import partial from "lodash/partial";
import sortBy from "lodash/sortBy";
import map from "lodash/map";

import classNames from 'classnames';
import {mpdQuery} from "../mpd";

import styles from "./Style.scss";

export default function QueuePage({queue, playback}) {
    if (!queue)
        return <h3>Loading...</h3>;

    const tracks = sortBy(queue, track => parseInt(track.pos || "10000"));

    const removeItem = pos => mpdQuery(`delete ${pos}`);
    const clearQueue = partial(mpdQuery, "clear");
    const setConsume = curr => mpdQuery(`consume ${curr ? 1 : 0}`);
    const setRandom = curr => mpdQuery(`random ${curr ? 1 : 0}`);
    const setSong = pos => {
        if (pos !== playback.song)
            mpdQuery(`seek ${pos} 0`).then(() => mpdQuery("play"))
    };

    const currConsume = parseInt(playback.consume) === 1;
    const currShuffle = parseInt(playback.random) === 1;

    return <React.Fragment>
        <h1>Queue</h1>
        <button className={`${styles.clearQueue}`} onClick={() => clearQueue()}>Clear Queue</button>
        <button
            className={classNames(
                styles.toggle,
                {[styles.enabled]: currConsume}
            )}
            onClick={() => setConsume(!currConsume)}
        >Consume: {currConsume ? "ON" : "OFF"}
        </button>
        <button
            className={classNames(
                styles.toggle,
                {[styles.enabled]: currShuffle}
            )}
            onClick={() => setRandom(!currShuffle)}
        >Shuffle: {currShuffle ? "ON" : "OFF"}</button>
        <div style={{height: "10px"}}/>
        {map(tracks, (track, i) =>
            <div key={i}>
                <div
                    className={classNames(
                        styles.queueItem,
                        {[styles.selected]: track.pos === playback.song}
                    )}
                    onClick={() => setSong(track.pos)}
                >
                    <div className={styles.songInfo}>
                        <span className={styles.trackTitle}>{track.title}</span><br/>
                        <span className={styles.trackDetails}>{track.album} - {track.artist}</span>
                    </div>
                    <button className={styles.removeItem} onClick={ev => {
                        ev.stopPropagation();
                        removeItem(track.pos)
                    }}>Remove
                    </button>
                </div>
            </div>
        )}
    </React.Fragment>
}