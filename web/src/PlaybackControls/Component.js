import React, { useState, useEffect, useRef, useContext } from "react";

import isEmpty from "lodash/isEmpty";
import isNaN from "lodash/isNaN";
import find from "lodash/find";

import styles from "./Style.scss";

import CurrentAlbum from "../CurrentAlbum";
import PreviousIcon from "../icons/prev.svg";
import NextIcon from "../icons/next.svg";
import PlayIcon from "../icons/play.svg";
import PauseIcon from "../icons/pause.svg";
import { mpdQuery } from "../mpd";
import { QueueContext } from "../Queue/Context";
import { PlaybackContext } from "./Context";

const buttonIconDim = {
  height: "70",
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
      if (isEmpty(song)) {
        elapsedRef.current = 0;
        setElapsed(0);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [state, elapsed, duration, song]);

  return elapsedState;
};

function ProgressBar({ elapsed, duration }) {
  if (typeof duration !== "number" || isNaN(duration)) {
    elapsed = 0.0;
    duration = 1.0;
  }
  const pct = parseInt((100 * elapsed) / duration);

  return (
    <div className={styles.progressBar}>
      <div className={styles.inner} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PlaybackControls() {
	const { queue } = useContext(QueueContext);
	const { playback } = useContext(PlaybackContext);

  const { state, song } = playback;
  const sendCmd = (cmd) => mpdQuery(cmd);

  const elapsed = parseFloat(playback.elapsed);
  const duration = parseFloat(playback.duration);

  const estElapsed = useElapsedTime(song, state, elapsed, duration);

  let msg, msgIcon;
  if (state === "play") {
    msg = "pause";
    msgIcon = <PauseIcon {...buttonIconDim} />;
  } else {
    msg = "play";
    msgIcon = <PlayIcon {...buttonIconDim} />;
  }
  const { album, title, artist } =
    (!isEmpty(song) &&
    find(queue || [], ({ pos }) => String(pos) === String(song))) || {};

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <ProgressBar duration={duration} elapsed={estElapsed} />
        <CurrentAlbum cls={styles["current-album"]} />
        <div className={styles["now-playing"]}>
          <div className={styles["song-info"]}>
            <h3>{title || "Nothing Playing"}</h3>
            {album && (
              <p>
                <b>{album}</b> - {artist}
              </p>
            )}
          </div>
        </div>
        <div className={styles["playback-buttons"]}>
          <button onClick={() => sendCmd("previous")}>
            <PreviousIcon {...buttonIconDim} />
          </button>
          <button onClick={() => sendCmd(msg.toLowerCase())}>{msgIcon}</button>
          <button onClick={() => sendCmd("next")}>
            <NextIcon {...buttonIconDim} />
          </button>
        </div>
        <div className={styles["last-child"]} />
      </div>
    </div>
  );
}
