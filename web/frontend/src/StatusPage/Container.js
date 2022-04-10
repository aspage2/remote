import { connect } from "react-redux";
import Component from "./Component";

import isUndefined from "lodash/isUndefined";
import isNull from "lodash/isNull";

const mapStateToProps = (state) => ({
  isUpdating: !(
    isUndefined(state.playback.updating_db) ||
    isNull(state.playback.updating_db)
  ),
});

export default connect(mapStateToProps, null)(Component);
