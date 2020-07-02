import React from 'react';
import {useMusicDatabaseQuery, englishTimeStr} from "../urls";
import classNames from "classnames";
import styles from "./Styles.scss"
import {SocketContext} from "../socket";


const SiteStats = stats => {
    const date = new Date(0);
    date.setUTCSeconds(parseInt(stats.db_update));
    return <React.Fragment>
        <h2>Database Stats</h2>
        <table>
            <tbody>
            <tr>
                <td><b>Unique Artists</b></td>
                <td>{stats.artists}</td>
            </tr>
            <tr>
                <td><b>Unique Albums</b></td>
                <td>{stats.albums}</td>
            </tr>
            <tr>
                <td><b>Unique Songs</b></td>
                <td>{stats.songs}</td>
            </tr>
            </tbody>
        </table>
        <span className={styles.totalPlayTime}><b>
            <u>Sum of Song Times</u>:{'\u00A0'}
            {englishTimeStr(parseInt(stats.db_playtime))}</b>
        </span>

        <h2>System</h2>
        <table>
            <tbody>
            <tr>
                <td><b>System Uptime</b></td>
                <td>{englishTimeStr(parseInt(stats.uptime))}</td>
            </tr>
            <tr>
                <td><b>Last Database Update</b></td>
                <td>{date.toDateString()}</td>
            </tr>
            </tbody>
        </table>
    </React.Fragment>;
};

function StatusPage(props) {

    const {data, loading, err} = useMusicDatabaseQuery("/data/stats");

    const updating = props.isUpdating;

    return <React.Fragment>
        <h1>Status, Stats, Settings</h1>
        <div>
            <div className={classNames(styles.dbUpdate, {[styles.active]: updating})}>
                Database Update: {updating ? "ON" : "OFF"}
            </div>
        </div>
        <button onClick={() => {
            props.socket.emit("dbUpdate");
        }}>Start Update
        </button>

        {loading ? <h3>...</h3> : (err ? <p>Can't get statistics.</p> : <SiteStats {...data}/>)}
    </React.Fragment>
}

export default props => <SocketContext.Consumer>
    {socket => <StatusPage socket={socket} {...props}/>}
</SocketContext.Consumer>