import React, { useState, useRef, useEffect } from "react";
import { mpdQuery } from "../mpd";

import map from "lodash/map";

import globalStyles from "../Global.scss";
import styles from "./Style.scss";

export default function MPDConsole() {
  const inputRef = useRef("");
  const [mpdCommand, setMPDCommand] = useState("");
  const [mpdResult, setMPDResult] = useState("");

  useEffect(() => {
    if (mpdCommand.length > 0) {
      mpdQuery(mpdCommand).then((res) => {
        setMPDResult(res);
        inputRef.current.value = "";
      });
    } else {
      setMPDResult("Enter a query in the prompt above...");
    }
  }, [mpdCommand]);
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMPDCommand(inputRef.current.value);
        }}
      >
        <input
          className={styles.consoleInput}
          size={80}
          id="mpd-command-input"
          ref={inputRef}
          type="text"
        />
        <input type="submit" style={{ display: "none" }} />
      </form>
      <div className={globalStyles.divider} />
      <p className={styles.monospace}>{mpdCommand || "\u00A0"}</p>
      <div className={styles.mpdResults}>
        {map(mpdResult.split("\n"), (line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </>
  );
}
