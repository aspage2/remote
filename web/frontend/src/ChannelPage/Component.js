import React from 'react';

import {SocketContext} from "../socket";
import _ from "lodash"

import styles from "./Style.scss"

import classnames from 'classnames';
import ToggleButton from "../ToggleButton";

function ChannelPage(props) {

    const {socket, channels} = props;

    const currChannels = channels.status;

    const setChannel = chan => socket.emit('channel', chan, () => {
    });
    return <React.Fragment>
        <h1>Audio Channels</h1>
        <p>Press the status button to turn all channels off</p>
        <div className={styles.channelList}>
            <button
                className={classnames(
                    styles.off,
                    {[styles.active]: currChannels.length === 0}
                )} onClick={() => setChannel("off")}>STATUS: {currChannels.length === 0 ? "OFF" : "ON"}</button>
            {
                _.map(channels.pinout, (channel, i) =>
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