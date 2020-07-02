import React, {useState, useEffect, useRef} from 'react';

import {SocketContext} from "../socket";

import _ from 'lodash';

import styles from "./Style.scss";
import {albumArtUrl} from "../urls";

import PreviousIcon from "../icons/prev.svg"
import NextIcon from "../icons/next.svg"
import PlayIcon from "../icons/play.svg"
import PauseIcon from "../icons/pause.svg"

const buttonIconDim = {
    height: "100",
    width: "55",
};

/**
 * useElapsedTime watches the current playback status, internally incrementing a counter
 * every second to approximate the current song progress.
 * @returns {float} approximate time elapsed, updated every second.
 */
const useElapsedTime = (song, state, elapsed, duration) => {

    const intervalRef = useRef(0);

    // Use a ref-state combo to track est. progress. The ref value
    // is used in the interval call to avoid function closure giving us a stale state,
    // While a state is maintained in parallel to trigger re-renders when the interval
    // completes.
    const elapsedRef = useRef(parseFloat(elapsed));
    const [elapsedState, setElapsed] = useState(elapsed);

    useEffect(() => {
        clearInterval(intervalRef.current);
        elapsedRef.current = elapsed;
        setElapsed(elapsed);

        const routine = () => {
            if (elapsedRef.current >= duration) {
                clearInterval(intervalRef.current);
            } else {
                elapsedRef.current = elapsedRef.current + 1;
                setElapsed(elapsedRef.current);
            }
        };
        if (elapsed !== undefined && duration !== undefined && state === "play") {
            intervalRef.current = setInterval(routine, 1000);
        } else {
            clearInterval(intervalRef.current);
            if (_.isEmpty(song)){
                elapsedRef.current = 0;
                setElapsed(0);
            }
        }

        return () => clearInterval(intervalRef.current)
    }, [state, elapsed, duration, song]);

    return elapsedState;
};

function ProgressBar({elapsed, duration}) {
    if (typeof duration !== "number" || _.isNaN(duration)) {
        elapsed = 0.0;
        duration = 1.0;
    }
    const pct = parseInt(100*elapsed / duration);

    return <div className={styles.progressBar}><div className={styles.inner} style={{width:`${pct}%`}}/></div>
}

function PlaybackControls({queue, playback, socket}) {
    const {state, volume, song} = playback;
    const sendCmd = cmd => socket.emit('playbackCommand', cmd);

    const elapsed = parseFloat(playback.elapsed);
    const duration = parseFloat(playback.duration);

    const estElapsed = useElapsedTime(song, state, elapsed, duration);

    let msg, msgIcon;
    if (state === "play") {
        msg = "pause";
        msgIcon = <PauseIcon {...buttonIconDim}/>
    } else {
        msg = "play";
        msgIcon = <PlayIcon {...buttonIconDim}/>;
    }
    const {album, title, artist, albumartist} = (
        !_.isEmpty(song) && _.find(queue || [], ({pos}) => String(pos) === String(song))
    );

    return <div className={styles.root}>
        <div className={styles['now-playing']}>
            {!_.isEmpty(album) ? <img alt={album} src={albumArtUrl({album, albumartist})}/> :
                <div className={styles["no-album-art"]}/>}
            <div className={styles["song-info"]}>
                <h3>{title || "Nothing Playing"}</h3>
                {album && <p><b>{album}</b> - {artist}</p>}
                <ProgressBar duration={duration} elapsed={estElapsed}/>
            </div>
        </div>
        <div className={styles["playback-buttons"]}>
            <button onClick={() => sendCmd('previous')}>
                <PreviousIcon {...buttonIconDim}/>
            </button>
            <button onClick={() => sendCmd(msg.toLowerCase())}>
                {msgIcon}
            </button>
            <button onClick={() => sendCmd('next')}>
                <NextIcon {...buttonIconDim}/>
            </button>
        </div>
        <div>
            <button onClick={() => sendCmd("volume -2")}>Vol -</button>
            <span>{volume}</span>
            <button onClick={() => sendCmd("volume +2")}>Vol +</button>
        </div>
    </div>
}

export default props => <SocketContext.Consumer>{
    socket => <PlaybackControls socket={socket} {...props}/>
}</SocketContext.Consumer>

