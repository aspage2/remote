
import {combineReducers} from "redux";

import {reducer as SnackbarReducer} from "./Snackbar";
import {reducer as QueueReducer} from "./Queue";
import {reducer as PlaybackReducer} from "./PlaybackControls";
import {reducer as ChannelReducer} from "./ChannelPage";


const reducer = combineReducers({
    snackbar: SnackbarReducer,
    queue: QueueReducer,
    playback: PlaybackReducer,
    channel: ChannelReducer,
});

export default reducer;
