import React from "react";

import classnames from "classnames";
import styles from "./Style.scss";

export default ({ onClick, light }) => {
  const cn = classnames({
    [styles.root]: true,
    [styles.light]: light,
  });
  return (
    <button className={cn} onClick={onClick}>
      <div className={styles["drawer-bar"]} />
      <div className={styles["drawer-bar"]} />
      <div className={styles["drawer-bar"]} />
    </button>
  );
};
