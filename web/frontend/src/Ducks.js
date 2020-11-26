
import {combineReducers} from "redux";

import {reducer as SnackbarReducer} from "./Snackbar";
import {makeReducer as QueueReducer} from "./Queue";
import {makeReducer as PlaybackReducer} from "./PlaybackControls";
import {makeReducer as ChannelReducer} from "./ChannelPage";

const ActionTypes = {
    CONNECTION_SET: "action_connection_set",
};

export const Actions = {
    setConnection: conn => ({type: ActionTypes.CONNECTION_SET, connected: conn})
}

const ConnectionReducer = initialConnected => (state, action) => {
    if (action.type === ActionTypes.CONNECTION_SET)
        return action.connected;
    return state || initialConnected || false;
}

const reducer = init => combineReducers({
    snackbar: SnackbarReducer,
    queue: QueueReducer(init.queue),
    playback: PlaybackReducer(init.playback),
    channel: ChannelReducer(init.channels),
    connected: ConnectionReducer(init.connected),
});

export default reducer;
