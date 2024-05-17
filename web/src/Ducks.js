import { combineReducers } from "redux";

import { makeReducer as PlaybackReducer } from "./PlaybackControls";

const reducer = (init) =>
  combineReducers({
    playback: PlaybackReducer(init.playback),
  });

export default reducer;
