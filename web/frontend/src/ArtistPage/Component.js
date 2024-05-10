import React from "react";

import sortBy from "lodash/sortBy";
import map from "lodash/map";
import AlbumCard from "../AlbumCard";
import { useMPDQuery } from "../hooks";
import { albumListFromData } from "../mpd";
import urls from "../urls";

export default function ArtistPage(props) {
  const { artist, history } = props;
  const { data, loaded, err } = useMPDQuery(`find artist "${artist}"`);
  const [show, _] = React.useState(false);

  if (!loaded) return <div />;
  if (err) return <h3>Error!</h3>;

  const alb = albumListFromData(data);
  const albums = sortBy(alb, (album) => album.date || 10000);

  return (
    <React.Fragment>
      <h1>Albums from {artist}</h1>
      <div style={{ marginTop: "10px" }}>
        {map(albums, (album, i) => (
          <AlbumCard
            key={i}
            info={album}
            hideDetails={!show}
            onClick={() =>
              history.push(urls.albumPage({albumartist: album.albumartist, album: album.album}))
            }
          />
        ))}
      </div>
    </React.Fragment>
  );
}
