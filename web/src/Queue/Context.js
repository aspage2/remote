import React, { useState, createContext } from "react";

export const QueueContext = createContext({
  queue: [],
  setQueue: (_) => {},
});

export function QueueProvider({ initial, children }) {
  const [queue, setQueue] = useState(initial);
  return (
    <QueueContext.Provider value={{ queue, setQueue }}>
      {children}
    </QueueContext.Provider>
  );
}
