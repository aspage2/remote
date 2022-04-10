import React, { useRef, useState, useEffect } from "react";

import map from "lodash/map";
import classnames from "classnames";

import styles from "./Style.scss";
import { albumArtUrl } from "../urls";
import { SocketContext } from "../socket";
import { albumListFromData, mpdQuery, tracksFromData } from "../mpd";

const AlbumItem = ({ album, albumartist, onClick }) => (
  <div className={classnames(styles.item, styles.noPadding)} onClick={onClick}>
    <img src={albumArtUrl({ album, albumartist })} />
    <div>
      {album}
      <br />
      <b>{albumartist}</b>
    </div>
  </div>
);

const TrackItem = ({ album, title, artist, add, onClick }) => (
  <div className={styles.item} onClick={onClick}>
    <div>
      {title}
      <br />
      <b>
        {artist} - {album}
      </b>
    </div>
    <button onClick={add}>Add</button>
  </div>
);

function useSearchQuery(searchTerm) {
  const [loadState, setLoadState] = useState({
    loaded: false,
    err: false,
    results: undefined,
  });
  useEffect(() => {
    setLoadState({ loaded: false, err: false, results: undefined });
    if (searchTerm.length === 0) return;
    const artist = new Promise((res, rej) => {
      mpdQuery(`search artist "${searchTerm}"`).then((data) => {
        let artists = new Set();
        for (const track of tracksFromData(data)) {
          artists.add(track.artist);
        }
        res(map(Array.from(artists), (a) => ({ artist: a })));
      });
    });
    const album = new Promise((res, rej) => {
      mpdQuery(`search album "${searchTerm}"`).then((data) => {
        res(albumListFromData(data));
      });
    });
    const track = new Promise((res, rej) => {
      mpdQuery(`search title "${searchTerm}"`).then((data) => {
        res(Array.from(tracksFromData(data)));
      });
    });
    Promise.all([artist, album, track]).then(([ar, al, tr]) => {
      setLoadState({
        loaded: true,
        err: false,
        results: {
          artist: ar,
          album: al,
          track: tr,
        },
      });
    });
  }, [searchTerm]);
  return loadState;
}

export function Search({ history, location }) {
  const q = new URLSearchParams(location.search);
  const loadedSearchTerm = q.get("q") || "";

  const inputRef = useRef(loadedSearchTerm);
  const [searchQuery, setSearchQuery] = useState(loadedSearchTerm);
  const { loaded, err, results } = useSearchQuery(searchQuery);

  return (
    <React.Fragment>
      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault();
          const q = inputRef.current.value;
          setSearchQuery(q);
          history.replace({
            search: `?q=${encodeURIComponent(q)}`,
          });
        }}
      >
        <input
          placeholder="Search..."
          size={30}
          className={styles.mainInput}
          type="text"
          ref={inputRef}
        />
        <input type="submit" value="Go" className={styles.mainSubmit} />
      </form>
      <br />
      {loaded && results && (
        <div>
          <h2>Results for "{searchQuery}"</h2>
          <div className={styles.column}>
            <h3>Artists</h3>
            {map(results.artist, ({ artist }, i) => (
              <div
                key={i}
                className={styles.item}
                onClick={() => history.push(`/web/artist/${artist}`)}
              >
                {artist}
              </div>
            ))}
          </div>
          <div className={styles.column}>
            <h3>Albums</h3>
            {map(results.album, ({ album, albumartist }, i) => (
              <AlbumItem
                key={i}
                album={album}
                albumartist={albumartist}
                onClick={() => {
                  history.push(
                    `/web/albumartist/${albumartist}/album/${album}`
                  );
                }}
              />
            ))}
          </div>
          <div className={styles.column}>
            <h3>Tracks</h3>
            {map(
              results.track,
              ({ title, album, track, albumartist, artist }, i) => (
                <TrackItem
                  key={i}
                  title={title}
                  album={album}
                  artist={artist}
                  onClick={() =>
                    history.push(
                      `/web/albumartist/${albumartist}/album/${album}`
                    )
                  }
                  add={() => {
                    socket.emit("findadd", { album, albumartist, track });
                  }}
                />
              )
            )}
          </div>
        </div>
      )}
      {loaded && err && <h1>Error.</h1>}
      {!loaded && searchQuery.length > 0 && <h1>loading...</h1>}
    </React.Fragment>
  );
}

export default (props) => (
  <SocketContext.Consumer>
    {(socket) => <Search socket={socket} {...props} />}
  </SocketContext.Consumer>
);
