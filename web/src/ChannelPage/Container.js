import { connect } from "react-redux";
import ChannelPage from "./Component";
import { Actions as ChannelActions } from "./Ducks";
import { Actions as SnackbarActions } from "../Snackbar/Ducks";

const mapStateToProps = (state) => ({
  channels: state.channel,
});

const mapDispatchToProps = (dispatch) => ({
  putChannels: (channels) => dispatch(ChannelActions.setChannels(channels)),
  putSnackbarMessage: (msg) => dispatch(SnackbarActions.showSnackbar(msg)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChannelPage);
