import { connect } from "react-redux";
import App from "./App";
import { Actions } from "../Snackbar";
import isUndefined from "lodash/isUndefined";
import isNull from "lodash/isNull";

const mapStateToProps = (state) => ({
  queueCount: state.queue.length,
  dbUpdating: !(
    isUndefined(state.playback.updating_db) ||
    isNull(state.playback.updating_db)
  ),
  volume: state.playback.volume,
  isConnected: state.connected,
});

const mapDispatchToProps = (dispatch) => ({
  showOnSnackbar: (msg) => dispatch(Actions.showSnackbar(msg)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
