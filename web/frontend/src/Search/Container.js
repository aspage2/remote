
import React from 'react';

import {connect} from 'react-redux';

import {Actions} from "../Snackbar/Ducks"
import Search from "./Component";

const mapDispatchToProps = dispatch => ({
    sendToSnackbar: msg => dispatch(Actions.showSnackbar(msg))
});


export default connect(null, mapDispatchToProps)(Search);