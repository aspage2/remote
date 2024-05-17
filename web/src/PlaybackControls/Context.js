import React, { createContext, useEffect, useState } from "react";
import { pullPlaybackInfo } from "../mpd";

const InitialPlayback = {album: "", artist: "", title: ""};

export const PlaybackContext = createContext({
	playback: InitialPlayback,
	setPlayback: _ => {},
});

export function PlaybackProvider({ initial, children }) {
	const [playback, setPlayback] = useState(initial);
	useEffect(() => { pullPlaybackInfo().then(setPlayback) }, []);

	return <PlaybackContext.Provider value={{playback, setPlayback}}>
		{ children }
	</PlaybackContext.Provider>
}
