import React from "react";

import AddIcon from "../icons/add.svg"

import styles from "./Style.scss";
import {albumArtUrl} from "../urls";

export default function AlbumCard(props){

    const [err, setErr] = React.useState(false);

    const {info:{album, albumartist, date}, buttonClick} = props;
    const src = albumArtUrl({album, albumartist});


    return <div className={` ${styles.root}`} onClick={props.onClick}>
        <img
            src={err ? `/static/notfound.png` : src}
            alt={album}
            className={styles['image-medium']}
            onError={() => setErr(true)}
        />
        <div className={styles["info-panel"]}>
            <span className={styles.album}>{album}</span>{date && ` - ${date}`}<br/>
            {albumartist}
        </div>
        {buttonClick && <button className={styles["add-button"]} onClick={ev => {
            ev.stopPropagation();
            buttonClick(ev);
        }}>
            <AddIcon width="30" height="30"/>
        </button>}
    </div>
}

AlbumCard.defaultProps = {
    hideDetails: true,
    onClick: () => {},
};


