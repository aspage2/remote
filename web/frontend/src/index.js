import React from 'react';

import {createStore} from 'redux';
import {pullPlaybackInfo, pullQueueInfo, startMpdWatcher} from "./mpd";

import App from "./App";
import ReactDOM from 'react-dom';
import {Provider as StoreProvider} from "react-redux";
import reducer from "./Ducks";

import axios from "axios";

import "./Global.scss";

const root = document.getElementById("root");

let initial = {};
// Pull current status, then render site
Promise.all([
    pullPlaybackInfo().then(res => {
        initial.playback = res
    }),
    pullQueueInfo().then(res => {
        initial.queue = res
    }),
    axios.get("/gpio/channels").then(res => {
        initial.channels = res.data;
    }),
]).then(
    () => {
        const store = createStore(reducer(initial));
        startMpdWatcher(store.dispatch);
        ReactDOM.render(
            <StoreProvider store={store}>
                <App/>
            </StoreProvider>
            , root);
    }
).catch(err => {
    ReactDOM.render(<>
        <h1>Congrats, it's broken.</h1>
        <p>Error: {JSON.stringify(err)}</p>
    </>, root)
})


