import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import {SocketContext} from "../socket";

import styles from "./Style.scss";

function QueuePage({queue, playback, socket}) {
    if (!queue)
        return <h3>Loading...</h3>;

    const tracks = _.sortBy(queue, track => parseInt(track.pos || "10000"));

    const removeItem = pos => socket.emit('queueRemove', pos);
    const clearQueue = () => socket.emit('queueRemove', 'all');
    const setSong = pos => {
        if (pos !== playback.song)
            socket.emit('queueSeek', pos);
    };

    const consume = parseInt(playback.consume) === 1;
    const shuffle = parseInt(playback.random) === 1;

    return <React.Fragment>
        <h1>Queue</h1>
        <button className={`${styles.clearQueue}`} onClick={() => clearQueue()}>Clear Queue</button>
        <button
            className={classNames(
                styles.toggle,
                {[styles.enabled]: consume}
            )}
            onClick={() => socket.emit("playbackCommand", `consume ${consume ? 0 : 1}`)}
        >Consume: {consume ? "ON" : "OFF"}
        </button>
        <button
            className={classNames(
                styles.toggle,
                {[styles.enabled]: shuffle}
            )}
            onClick={() => socket.emit("playbackCommand", `random ${shuffle ? 0 : 1}`)}
        >Shuffle: {shuffle ? "ON" : "OFF"}</button>
        <div style={{height: "10px"}}/>
        {_.map(tracks, (track, i) =>
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

export default props => <SocketContext.Consumer>
    {socket => <QueuePage socket={socket} {...props}/>}
</SocketContext.Consumer>