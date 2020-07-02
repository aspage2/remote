
import {Actions as SnackbarActions} from '../Snackbar';
import {connect} from 'react-redux';
import Component from './Component';

const mapStateToProps = state => ({
    playback: state.playback,
    queue: state.queue,
});

const mapDispatchToProps = dispatch => ({
    putMessage: message => dispatch(SnackbarActions.showSnackbar(message)),
    hideMessage: () => dispatch(SnackbarActions.hideSnackbar()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);