import React from "react";
import classNames from "classnames";

import _ from "lodash";

import AddIcon from "../icons/add.svg"

import styles from "./Style.scss";
import {albumArtUrl} from "../urls";

export default function AlbumCard(props){
    const info_class = classNames({
        [styles['info-panel']]: true,
        [styles['normally-hidden']]: props.hideDetails
    });

    const {info:{album, albumartist, date}, buttonClick} = props;
    const src = albumArtUrl({album, albumartist});

    return <div className={`${styles['image-medium']} ${styles.root} floating`}>
        <img src={src} alt={album} />
        <div className={info_class} onClick={_.partial(props.onClick, album, albumartist)}>
            <h3>{album}</h3>
            <p className={styles.infoPanel}>{albumartist}</p>
            {date && <p>{date}</p>}
        </div>
        {buttonClick && <button className={styles["add-button"]} onClick={buttonClick}>
            <AddIcon width="30" height="30"/>
        </button>}
    </div>
}

AlbumCard.defaultProps = {
    hideDetails: true,
    onClick: () => {},
};


