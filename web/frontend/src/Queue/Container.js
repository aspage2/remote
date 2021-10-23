import { connect } from "react-redux";

import Component from "./Component";
import { Actions } from "./Ducks";

const mapStateToProps = (state) => ({
  queue: state.queue,
  playback: state.playback,
});

const mapDispatchToProps = (dispatch) => ({
  setQueue: (queue) => dispatch(Actions.setQueue(queue)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
