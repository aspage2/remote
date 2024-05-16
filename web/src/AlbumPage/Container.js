import { connect } from "react-redux";
import AlbumPage from "./Component";
import { Actions } from "../Snackbar";

const mapDispatchToProps = (dispatch) => ({
  showMessage: (msg) => dispatch(Actions.showSnackbar(msg)),
});

export default connect(null, mapDispatchToProps)(AlbumPage);
