
import {connect} from "react-redux";
import ChannelPage from "./Component"

const mapStateToProps = state => ({
    channels: state.channel
});

export default connect(mapStateToProps, null)(ChannelPage);