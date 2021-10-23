import React from 'react';
import {useMPDQuery, englishTimeStr} from "../urls";
import classNames from "classnames";
import styles from "./Styles.scss"
import globalStyles from "../Global.scss";
import {SocketContext} from "../socket";
import {mpdQuery, objFromData} from "../mpd";
import {Link} from "react-router-dom";


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
        <div className={globalStyles.divider}/>
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

    const {data, loaded, err} = useMPDQuery("stats");
    if (!loaded) {
        return <h3>...</h3>;
    }
    if (err) {
        return <h3>Can't get statistics.</h3>
    }
    const stats = objFromData(data);
    const updating = props.isUpdating;

    return <React.Fragment>
        <h1>System</h1>
        <Link to={"/web/console"}>MPD Console</Link>
        <div>
            <div className={classNames(styles.dbUpdate, {[styles.active]: updating})}>
                Database Update: {updating ? "ON" : "OFF"}
            </div>
        </div>
        <button onClick={()=>mpdQuery("update")} disabled={updating}>
            Start an Update
        </button>

        <div className={globalStyles.divider}/>

        <SiteStats {...stats}/>
    </React.Fragment>
}

export default props => <SocketContext.Consumer>
    {socket => <StatusPage socket={socket} {...props}/>}
</SocketContext.Consumer>