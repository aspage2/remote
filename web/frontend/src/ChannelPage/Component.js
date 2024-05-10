import React from "react";

import map from "lodash/map";
import includes from "lodash/includes";

import styles from "./Style.scss";

import classnames from "classnames";
import ToggleButton from "../ToggleButton";

export default function ChannelPage(props) {
  const { channels, putChannels, putSnackbarMessage } = props;
  const currChannels = channels.active;

  const setChannel = (chan) => {
    const req = {
      channel_id: chan,
      action: "toggle",
    };
    fetch("/gpio/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
      .then((res) => {
        putChannels(res.data);
      })
      .catch((reason) => {
        putSnackbarMessage(`Error: ${reason.response.data.detail}`);
      });
  };
  const sysOff = () => {
    const req = { action: "sys_off" };
    fetch("/gpio/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    }).then((res) => {
      putChannels(res.data);
    });
  };
  return (
    <React.Fragment>
      <h1>Audio Channels</h1>
      <p>Press the status button to turn all channels off</p>
      <div className={styles.channelList}>
        <button
          className={classnames(styles.off, {
            [styles.active]: currChannels.length === 0,
          })}
          onClick={sysOff}
        >
          STATUS: {currChannels.length === 0 ? "OFF" : "ON"}
        </button>
        {map(channels.channels, (channel, i) => (
          <div key={i}>
            <ToggleButton
              text={channel.desc}
              active={includes(currChannels, channel.name)}
              onClick={() => setChannel(channel.name)}
            />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

