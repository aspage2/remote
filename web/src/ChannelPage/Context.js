import React, { useState, createContext, useEffect } from "react";

const InitialChannelState = {
	active: [],
	channels: [],
};

export const ChannelContext = createContext({
	channels: InitialChannelState,
	setChannels: _ => {},
});

export function ChannelProvider({ initial, children }) {
	const [channels, setChannels] = useState(initial);
	useEffect(() => {
		fetch("/go/channels")
			.then(res => res.json())
			.then(setChannels)
	}, []);
	return <ChannelContext.Provider value={{channels, setChannels}}>
		{ children }
	</ChannelContext.Provider>
}
