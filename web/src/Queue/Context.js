import React, { useState, useEffect, createContext } from "react";
import { pullQueueInfo } from "../mpd";

const InitialQueue = [];

export const QueueContext = createContext({
	queue: InitialQueue, 
	setQueue: _ => {}
});

export function QueueProvider({ initial, children }) {
	const [queue, setQueue] = useState(initial);
	useEffect(() => {
		pullQueueInfo().then(setQueue);
	}, []);
	return <QueueContext.Provider value={{queue, setQueue}}>
		{ children }
	</QueueContext.Provider>
}

