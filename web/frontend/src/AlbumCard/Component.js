import React from "react";

import styles from "./Style.scss";
import urls from "../urls";

export default function AlbumCard(props) {
  const [err, setErr] = React.useState(false);

  const {
    info: { album, albumartist, date },
  } = props;
  const src = urls.albumArtUrl({ album, albumartist });

  return (
    <div className={styles.root} onClick={props.onClick}>
      <img
        src={err ? `/static/notfound.png` : src}
        alt={album}
        onError={() => setErr(true)}
      />
      <div className={styles["info-panel"]}>
        <span className={styles.album}>{album}</span>
        {date && ` - ${date}`}
        <br />
        {albumartist}
      </div>
    </div>
  );
}

AlbumCard.defaultProps = {
  onClick: () => {},
};
