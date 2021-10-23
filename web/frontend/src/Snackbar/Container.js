import { connect } from "react-redux";
import { Actions } from "./Ducks";

import { Snackbar } from "./Component";

const mapStateToProps = (state) => ({
  message: state.snackbar.message,
  shown: state.snackbar.shown,
});

const mapDispatchToProps = (dispatch) => ({
  hideSnackbar: () => dispatch(Actions.hideSnackbar()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Snackbar);
