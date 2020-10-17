import React from "react";

import {albumArtUrl} from "../urls";

export default function CurrentAlbum(props) {

    const [err, setErr] = React.useState(false);

    const {playback, queue, cls} = props;

    if (!playback.hasOwnProperty("song"))
        return <div/>

    const src = albumArtUrl(queue[parseInt(playback.song)]);
    return <img
        src={err ? `/static/notfound.png` : src}
        alt={src}
        className={cls}
        onError={() => setErr(true)}
    />
}
