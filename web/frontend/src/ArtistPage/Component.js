import React from "react";

import _ from "lodash";
import AlbumCard from "../AlbumCard";
import { useMPDQuery } from "../urls";
import { albumListFromData, mpdQuery } from "../mpd";

export default function ArtistPage(props) {
  const { artist, history } = props;
  const { data, loaded, err } = useMPDQuery(`find artist "${artist}"`);
  const [show, setShow] = React.useState(false);

  if (!loaded) return <div />;
  if (err) return <h3>Error!</h3>;

  const alb = albumListFromData(data);
  const albums = _.sortBy(alb, (album) => album.date || 10000);

  return (
    <React.Fragment>
      <h1>Albums from {artist}</h1>
      <div style={{ marginTop: "10px" }}>
        {_.map(albums, (album, i) => (
          <AlbumCard
            key={i}
            info={album}
            hideDetails={!show}
            onClick={() =>
              history.push(
                `/web/albumartist/${album.albumartist}/album/${album.album}`
              )
            }
          />
        ))}
      </div>
    </React.Fragment>
  );
}
