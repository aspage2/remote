
import {combineReducers} from "redux";

import {reducer as SnackbarReducer} from "./Snackbar";
import {makeReducer as QueueReducer} from "./Queue";
import {makeReducer as PlaybackReducer} from "./PlaybackControls";
import {makeReducer as ChannelReducer} from "./ChannelPage";


const reducer = init => combineReducers({
    snackbar: SnackbarReducer,
    queue: QueueReducer(init.queue),
    playback: PlaybackReducer(init.playback),
    channel: ChannelReducer([]),
});

export default reducer;
