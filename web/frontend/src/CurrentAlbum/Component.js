import React from "react";

import {albumArtUrl} from "../urls";

import styles from "./Style.scss"

export default function CurrentAlbum(props) {

    const [err, setErr] = React.useState(false);

    const {playback, queue, cls} = props;

    if (!playback.hasOwnProperty("song"))
        return <div className={styles.err}/>

    const src = albumArtUrl(queue[parseInt(playback.song)]);
    return err ? <div className={styles.err} /> : <img
        src={err ? `/static/notfound.png` : src}
        alt={src}
        className={cls}
        onError={() => {
            setErr(true)
        }}
    />
}
