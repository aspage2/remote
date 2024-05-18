import React, { createContext, useState } from "react";

const InitialSnackbar = { shown: false, message: "" };

export const SnackbarContext = createContext({
  snackbar: InitialSnackbar,
  showSnackbar: (_) => {},
  hideSnackbar: () => {},
});

export function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState(InitialSnackbar);

  function showSnackbar(msg) {
    setSnackbar({
      message: msg,
      shown: true,
    });
  }

  function hideSnackbar() {
    setSnackbar({ message: "", shown: false });
  }

  return (
    <SnackbarContext.Provider value={{ snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
}
