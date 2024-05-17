import React, { useContext } from "react";

import urls from "../urls";

import styles from "./Style.scss";
import { PlaybackContext } from "../PlaybackControls/Context";
import { QueueContext } from "../Queue/Context";

export default function CurrentAlbum({ cls }) {
  const [err, setErr] = React.useState(false);

	const { playback } = useContext(PlaybackContext);
	const { queue } = useContext(QueueContext);

  if (!playback.hasOwnProperty("song")) return <div className={styles.err} />;

  const src = urls.albumArtUrl(queue[parseInt(playback.song)]);
  return err ? (
    <div className={styles.err} />
  ) : (
    <img
      src={err ? `/static/notfound.png` : src}
      alt={src}
      className={cls}
      onError={() => {
        setErr(true);
      }}
    />
  );
}
