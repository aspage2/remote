import React, { useState, createContext } from "react";

export const Connected = 0;
export const MPDNotConnected = 1;
export const ProxyNotConnected = 2;

const InitialConnectedState = ProxyNotConnected;

export function NotConnectedMsg(lvl) {
	if (lvl === ProxyNotConnected)
		return "Proxy Connection Lost";
	if (lvl === MPDNotConnected) 
		return "No MPD Connection";
	return null;
}

export const ConnectionContext = createContext({
  connected: InitialConnectedState,
  setConnected: (_) => {},
});

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(false);
  return (
    <ConnectionContext.Provider value={{ connected, setConnected }}>
      {children}
    </ConnectionContext.Provider>
  );
}
