import React from 'react';

import {createSocketClient} from "./socket";
import {createStore} from 'redux';

import App from "./App";
import ReactDOM from 'react-dom';
import {Provider as StoreProvider} from "react-redux";
import reducer from "./Ducks";

import {SocketContext} from "./socket";


const store = createStore(reducer);
const socket = createSocketClient(store.dispatch);


ReactDOM.render(<SocketContext.Provider value={socket}>
    <StoreProvider store={store}>
        <App/>
    </StoreProvider>
</SocketContext.Provider>, document.getElementById("root"));
