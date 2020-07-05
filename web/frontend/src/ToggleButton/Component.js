
import React from "react";
import classNames from "classnames";
import styles from "./Style.scss";

export default function ToggleButton(props) {
    const cls = classNames({
        [styles["toggle-button"]]: true,
        [styles["active"]]: props.active,
    });

    return <button
        className={cls}
        onClick={() => props.onClick(!props.active)}
    >{props.text}</button>
}