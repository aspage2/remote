
import {connect} from 'react-redux';
import App from "./App";
import {Actions} from "../Snackbar/Ducks";
import _ from "lodash";

const mapStateToProps = state => ({
    queueCount: state.queue.length,
    dbUpdating: !(_.isUndefined(state.playback.updating_db) || _.isNull(state.playback.updating_db))
});

const mapDispatchToProps = dispatch => ({
   showOnSnackbar: msg => dispatch(Actions.showSnackbar(msg))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);