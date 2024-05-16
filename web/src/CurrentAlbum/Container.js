import { connect } from "react-redux";
import Component from "./Component";

const mapStateToProps = (state) => ({
  playback: state.playback,
  queue: state.queue,
});

const mapDispatchToProps = (dispatch) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
