import React from 'react';

import axios from "axios";

import {SocketContext} from "../socket";
import _ from "lodash"

import styles from "./Style.scss"

import classnames from 'classnames';
import ToggleButton from "../ToggleButton";

function ChannelPage(props) {

    const {channels, putChannels, putSnackbarMessage} = props;
    const currChannels = channels.active;

    const setChannel = chan => {
        axios.post("/gpio/channels", {
            "channel_id": chan,
            "action": "toggle",
        }).then(res => {
            putChannels(res.data);
        }).catch(reason => {
            putSnackbarMessage(`Error: ${reason.response.data.detail}`);
        });
    }
    const sysOff = () => {
        axios.post("/gpio/channels", {
            "action": "sys_off"
        }).then(res => {
            putChannels(res.data);
        });
    }
    return <React.Fragment>
        <h1>Audio Channels</h1>
        <p>Press the status button to turn all channels off</p>
        <div className={styles.channelList}>
            <button
                className={classnames(
                    styles.off,
                    {[styles.active]: currChannels.length === 0}
                )} onClick={sysOff}>STATUS: {currChannels.length === 0 ? "OFF" : "ON"}</button>
            {
                _.map(channels.channels, (channel, i) =>
                    <div key={i}>
                        <ToggleButton
                            text={channel.desc}
                            active={_.includes(currChannels, channel.name)}
                            onClick={() => setChannel(channel.name)}
                        />
                    </div>
                )
            }
        </div>
    </React.Fragment>
}

export default props => <SocketContext.Consumer>
    {socket => <ChannelPage socket={socket} {...props}/>}
</SocketContext.Consumer>