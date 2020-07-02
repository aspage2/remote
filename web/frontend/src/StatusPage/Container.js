
import {connect} from 'react-redux';
import Component from "./Component";

import _ from 'lodash';

const mapStateToProps = state => ({
    isUpdating: !(_.isUndefined(state.playback.updating_db) || _.isNull(state.playback.updating_db))
});

export default connect(mapStateToProps, null)(Component);