import React, { useState, createContext } from "react";

export const ChannelContext = createContext({
  channels: null,
  setChannels: (_) => {},
});

export function ChannelProvider({ initial, children }) {
  const [channels, setChannels] = useState(initial);
  return (
    <ChannelContext.Provider value={{ channels, setChannels }}>
      {children}
    </ChannelContext.Provider>
  );
}
