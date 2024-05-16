import React from "react";

import { createStore } from "redux";
import { pullPlaybackInfo, pullQueueInfo, startMpdWatcher } from "./mpd";

import App from "./App";
import ReactDOM from "react-dom";
import { Provider as StoreProvider } from "react-redux";
import reducer from "./Ducks";

import "./Global.scss";

const root = document.getElementById("root");

let initial = {};

async function pullChannels() {
	const resp = await fetch("/go/channels");
	const data = await resp.json();
	return data;
}

// Pull current status, then render site
Promise.all([
  pullPlaybackInfo().then((res) => {
    initial.playback = res;
  }),
  pullQueueInfo().then((res) => {
    initial.queue = res;
  }),
	pullChannels().then(res => {initial.channels = res}),
])
  .then(() => {
    const store = createStore(reducer(initial));
    startMpdWatcher(store.dispatch);
    ReactDOM.render(
      <StoreProvider store={store}>
        <App />
      </StoreProvider>,
      root
    );
  })
  .catch((err) => {
    ReactDOM.render(
      <>
        <h1>Congrats, it's broken.</h1>
        <p>Error: {JSON.stringify(err)}</p>
      </>,
      root
    );
  });
