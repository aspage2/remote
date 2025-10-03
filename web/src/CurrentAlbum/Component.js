import React, { useContext, useEffect } from "react";

import urls from "../urls";

import styles from "./Style.scss";
import { PlaybackContext } from "../PlaybackControls/Context";
import { QueueContext } from "../Queue/Context";

export default function CurrentAlbum({ cls }) {
  const [err, setErr] = React.useState(false);

  const { playback } = useContext(PlaybackContext);
  const { queue } = useContext(QueueContext);

	// If the song changes over, reset error state
	useEffect(() => {setErr(false)}, [playback.playlist, playback.song]);

  if (!playback.hasOwnProperty("song") || queue.length === 0) return <div className={styles.err} />;
	const alb = queue[parseInt(playback.song)];
	if (alb.albumartist === undefined)
		alb.albumaritst = alb.artist;
  const src = urls.albumArtUrl(alb);
  return err ? (
    <div className={styles.err} />
  ) : (
    <img
      src={src}
      alt={src}
      className={cls}
      onError={() => {
        setErr(true);
      }}
    />
  );
}
