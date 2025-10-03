import React, { useContext, useState } from "react";
import { timeStr } from "../utils";
import { useMPDQuery } from "../hooks";
import urls from "../urls";

import toPairs from "lodash/toPairs";
import sumBy from "lodash/sumBy";
import maxBy from "lodash/maxBy";
import uniqBy from "lodash/uniqBy";
import map from "lodash/map";
import countBy from "lodash/countBy";
import isEmpty from "lodash/isEmpty";

import styles from "./Style.scss";
import { mpdQuery, tracksFromData } from "../mpd";

import { SnackbarContext } from "../Snackbar/Context";

// mostCommonValue returns the value which makes up the majority of
// items in a set.
function mostCommonValue(l, k) {
  if (isEmpty(l)) {
    return [undefined, undefined];
  }
  const counts = countBy(l, k);
  return maxBy(toPairs(counts), ([_, c]) => c);
}

function runTimeString(runTime) {
	const runHours = Math.floor(runTime / 3600);
	const runMinutes = Math.floor((runTime % 3600) / 60);

	if (runHours > 0)
		return `${runHours} hr ${runMinutes} min`
	return `${runMinutes} min`
}

export default function AlbumPage({ album, albumartist }) {
  album = decodeURIComponent(album);
  albumartist = decodeURIComponent(albumartist);
  const { showSnackbar } = useContext(SnackbarContext);
  const { loaded, err, data } = useMPDQuery(
    `find albumartist "${albumartist}" album "${album}"`
  );
	const [artError, setArtError] = useState(false);
  if (!loaded) return <h2>Loading...</h2>;
  if (err) {
		debugger;
		return <>
			<h1>{album}</h1>
			<h2>Error Fetching Data</h2>
			<p>{data.toString()}</p>
		</>
	}

  const tracks = Array.from(tracksFromData(data));

  // Indicates that this is a compilation album, changing what information
  // is displayed on the tracklist
  const multiArtist = uniqBy(tracks, "artist").length > 1;

  // Calculate the duration of this album in hours & minutes
  const runTime = sumBy(tracks, (t) => parseInt(t.time));

  // If the tracks have different dates, choose the most common one.
  const [date, _] = mostCommonValue(tracks, "date");
  const [genre, __] = mostCommonValue(tracks, "genre");

  const albumAdd = () =>
    mpdQuery(`findadd album "${album}" albumartist "${albumartist}"`).then(() =>
      showSnackbar("Album added")
    );
  const trackAdd = (track) =>
    mpdQuery(
      `findadd album "${album}" albumartist "${albumartist}" track ${track}`
    ).then(() => showSnackbar("Track added"));


  return (
    <React.Fragment>
      <h1>{album}</h1>
      <div className={`${styles.albumInfo} ${styles.column}`}>
        <img 
					alt={album} 
					src={artError ? "/static/notfound.png" : urls.albumArtUrl({ albumartist, album })}
					onError={() => setArtError(true)}
				/>
        <br />
        <br />
        <b>{albumartist}</b>
        {(date && ` - ${date}`) || ""}
        <br />
				{runTimeString(runTime)}
        <br />
        <i>Genre: {genre}</i>
        <br />
        <br />
        <button className={styles.addAlbum} onClick={albumAdd}>
          Add Album to Queue
        </button>
      </div>

      <div className={styles.column}>
        {map(tracks, (track, i) => (
          <div key={i} className={styles.trackItem}>
            <span className={styles.trackNum}>{track.track}.</span>
            <div className={styles.info}>
              <span className={styles.title}>{track.title}</span>
              <br />
              {multiArtist && (
                <span className={styles.artist}>{track.artist}</span>
              )}
            </div>
            <span className={styles.time}>{timeStr(track.time)}</span>
            <div className={styles["track-item-control"]}>
              <button onClick={() => trackAdd(track.track)}>Add</button>
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
