import React, { useContext } from "react";

import map from "lodash/map";
import includes from "lodash/includes";

import styles from "./Style.scss";

import classnames from "classnames";
import ToggleButton from "../ToggleButton";
import { ChannelContext } from "./Context";
import { SnackbarContext } from "../Snackbar/Context";

export default function ChannelPage() {
  const { channels, setChannels } = useContext(ChannelContext);
  const { showSnackbar } = useContext(SnackbarContext);

  const currChannels = channels.active;

  async function setChannel(chan) {
    const req = {
      channel_id: chan,
      action: "toggle",
    };
    const resp = await fetch("/go/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });
    if (!resp.ok) {
      showSnackbar(await resp.text());
      return;
    }
    const data = await resp.json();
    setChannels(data);
  }
  async function sysOff() {
    const response = await fetch("/go/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"action": "sys_off"}`,
    });
    if (!response.ok) {
      showSnackbar(await response.text());
      return;
    }
    setChannels(await response.json());
  }

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
