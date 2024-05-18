import React, { useContext, useEffect } from "react";
import { startMpdWatcher } from "./mpd";

import App from "./App";
import ReactDOM from "react-dom";

import "./Global.scss";

import { SnackbarContext, SnackbarProvider } from "./Snackbar/Context";
import { ConnectionContext, ConnectionProvider } from "./App/Context";
import { QueueContext, QueueProvider } from "./Queue/Context";
import { PlaybackContext, PlaybackProvider } from "./PlaybackControls/Context";

import { pullPlaybackInfo, pullQueueInfo } from "./mpd";
import { ChannelProvider } from "./ChannelPage/Context";

function Root() {
  const { setConnected } = useContext(ConnectionContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const { setQueue } = useContext(QueueContext);
  const { setPlayback } = useContext(PlaybackContext);

  useEffect(
    () => startMpdWatcher(setConnected, setPlayback, setQueue, showSnackbar),
    []
  );

  return <App />;
}
async function start() {
  const playback = await pullPlaybackInfo();
  const queue = await pullQueueInfo();
  const channels = await fetch("/go/channels").then((res) => res.json());
  ReactDOM.render(
    <PlaybackProvider initial={playback}>
      <QueueProvider initial={queue}>
        <ChannelProvider initial={channels}>
          <SnackbarProvider>
            <ConnectionProvider>
              <Root />
            </ConnectionProvider>
          </SnackbarProvider>
        </ChannelProvider>
      </QueueProvider>
    </PlaybackProvider>,
    document.getElementById("root")
  );
}
start();
