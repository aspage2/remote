import React, { useState, createContext } from "react";

const InitialConnectedState = false;

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
