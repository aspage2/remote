import React, { useContext } from "react";
import urls from "../urls";
import { englishTimeStr } from "../utils";
import { useHttpGet, useMPDQuery } from "../hooks";
import classNames from "classnames";
import styles from "./Styles.scss";
import globalStyles from "../Global.scss";
import { isDBUpdating, mpdQuery, objFromData } from "../mpd";
import { Link } from "react-router-dom";
import { PlaybackContext } from "../PlaybackControls/Context";

function SiteStats() {
  const { data, loaded, err } = useMPDQuery("stats");
  if (!loaded) {
    return <h3>...</h3>;
  }
  if (err) {
    return <h3>Can't get statistics.</h3>;
  }
  const stats = objFromData(data);
  const date = new Date(0);
  date.setUTCSeconds(parseInt(stats.db_update));
  return (
    <React.Fragment>
      <h2>Database Stats</h2>
			<h3>Unique Counts</h3>
      <table><tbody>
				<tr>
					<td><b>Artists:</b></td>
					<td>{stats.artists}</td>
				</tr>
				<tr>
					<td><b>Albums:</b></td>
					<td>{stats.albums}</td>
				</tr>
				<tr>
					<td><b>Songs:</b></td>
					<td>{stats.songs}</td>
				</tr>
			</tbody></table>
      <span className={styles.totalPlayTime}>
        <b>Sum of Song Times</b>:  {englishTimeStr(parseInt(stats.db_playtime))}
      </span>
      <div className={globalStyles.divider} />
      <table>
        <tbody>
          <tr>
            <td> <b>System Uptime</b> </td>
            <td>{englishTimeStr(parseInt(stats.uptime))}</td>
          </tr>
          <tr>
            <td> <b>Last Database Update</b> </td>
            <td>{date.toDateString()}</td>
          </tr>
        </tbody>
      </table>
    </React.Fragment>
  );
};

function vResult({loaded, err, data}, then = x => x) {
	if (!loaded) {
		return "...";
	} else if (err) {
		return <span className={styles.err}>Error :/</span>;
	}
	return then(data);
}

function ComponentVersions() {
  const mpdVersion = useHttpGet("/go/mpd/version");
	const proxyVersion = useHttpGet("/go/version");

	return <>
		<h2>Component Versions</h2>
		<table><tbody>
			<tr>
				<td><b>MPD Version:</b></td>
				<td>{vResult(mpdVersion, d=>d.version)}</td>
			</tr>
			<tr>
				<td><b>Proxy Version:</b></td>
				<td>{vResult(proxyVersion, d=>d.version)}</td>
			</tr>
		</tbody></table>
	</>
}

export default function StatusPage() {

  const { playback } = useContext(PlaybackContext);
  const updating = isDBUpdating(playback);

  return (
    <React.Fragment>
      <h1>System</h1>
      <Link to={urls.consolePage()}>
				<div 
					style={{marginBottom: "20px"}}
					className={globalStyles.globalButton}
				>
						 {"[$ _ ]"} Go To MPD Console 
				</div>
		  </Link>
      <div>
        <div
          className={classNames(styles.dbUpdate, { [styles.active]: updating })}
        >
          Database Update: {updating ? "ON" : "OFF"}
        </div>
      </div>
      <button onClick={() => mpdQuery("update")} disabled={updating}>
        Start an Update
      </button>

      <div className={globalStyles.divider} />
      <ComponentVersions/>
      <div className={globalStyles.divider} />

      <SiteStats />
    </React.Fragment>
  );
}
