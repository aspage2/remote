import io from "socket.io-client";

import { Actions as PlaybackActions } from "./PlaybackControls";
import { Actions as QueueActions } from "./Queue";
import { Actions as ChannelActions } from "./ChannelPage";
import { Actions as SnackbarActions } from "./Snackbar";

export const createSocketClient = (dispatch) => {
  const socket = io();

  socket.on("status", (data) => {
    dispatch(PlaybackActions.setPlayback(data));
  });

  socket.on("queue", (data) => {
    dispatch(QueueActions.setQueue(data));
  });

  socket.on("channel", (data) => {
    dispatch(ChannelActions.setChannels(data));
  });

  socket.on("update", (data) => {
    if (data) {
      dispatch(SnackbarActions.showSnackbar("A database update started"));
    }
  });

  return socket;
};

import { createContext } from "react";
export const SocketContext = createContext({});
