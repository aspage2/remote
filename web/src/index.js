import React, { useContext, useEffect } from "react";
import { startMpdWatcher } from "./mpd";

import App from "./App";
import ReactDOM from "react-dom";
import { MpdStateProvider } from "./context";

import "./Global.scss";

import { SnackbarContext } from "./Snackbar/Context";
import { ConnectionContext } from "./App/Context";
import { QueueContext } from "./Queue/Context";
import { PlaybackContext } from "./PlaybackControls/Context";

import { pullPlaybackInfo, pullQueueInfo } from "./mpd";

function Root() {
	const { setConnected } = useContext(ConnectionContext);
	const { showSnackbar } = useContext(SnackbarContext);
	const { setQueue } = useContext(QueueContext);
	const { setPlayback } = useContext(PlaybackContext);

	useEffect(
		() => startMpdWatcher(
			setConnected,
			setPlayback,
			setQueue,
			showSnackbar
		),
		[],
	);

	return <App />
}
let initial = {};
Promise.all([
	pullPlaybackInfo().then(res => initial.playback = res),
	pullQueueInfo().then(res => initial.queue = res),
	fetch("/go/channels").then(res => res.json()).then(res => initial.channels = res),
]).then(() =>
	ReactDOM.render(
		<MpdStateProvider initial={initial}><Root/></MpdStateProvider>, document.getElementById("root")
	)
);
