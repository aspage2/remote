import React, { createContext, useState } from "react";

export const PlaybackContext = createContext({
	playback: null,
	setPlayback: _ => {},
});

export function PlaybackProvider({ initial, children }) {
	const [playback, setPlayback] = useState(initial);
	return <PlaybackContext.Provider value={{playback, setPlayback}}>
		{ children }
	</PlaybackContext.Provider>
}
