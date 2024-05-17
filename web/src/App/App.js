import React, { useContext, useState } from "react";

import styles from "./Style.scss";

import classnames from "classnames";

import Search from "../Search";
import { Route, Redirect, Switch, Link, BrowserRouter } from "react-router-dom";
import PlaybackControls from "../PlaybackControls";
import Snackbar from "../Snackbar";
import AlbumPage from "../AlbumPage";
import ArtistPage from "../ArtistPage";
import ChannelPage from "../ChannelPage";
import Queue from "../Queue";
import Browse from "../Browse/Browse";
import StatsPage from "../StatusPage";
import MPDConsole from "../MPDConsole/Component";
import { isDBUpdating, mpdQuery } from "../mpd";
import { useMediaQuery } from "react-responsive";
import NavButton from "../NavButton";
import VolDown from "../icons/vol_down.svg";
import VolUp from "../icons/vol_up.svg";
import { ConnectionContext } from "./Context";
import { QueueContext } from "../Queue/Context";
import { PlaybackContext } from "../PlaybackControls/Context";

export default function App() {
  const smallScreen = useMediaQuery({query: "(max-width: 800px)"});

  const [drawerOpen, setDrawer] = useState(false);

	const { connected } = useContext(ConnectionContext);
	const { playback } = useContext(PlaybackContext);
	const { queue: {length: queueCount} } = useContext(QueueContext);

	const dbUpdating = isDBUpdating(playback);

  const Nav = () => {
    const cn = classnames({
      [styles["root-nav"]]: true,
      [styles.open]: !smallScreen || drawerOpen,
    });
    const Link_ = (props) => (
      <Link onClick={() => setDrawer(false)} {...props} />
    );
    return (
      <div className={cn} onClick={() => setDrawer(false)}>
        <div onClick={(ev) => ev.stopPropagation()} className={styles.nav}>
          {smallScreen && (
            <div className={styles["nav-button-div"]}>
              <NavButton light onClick={() => setDrawer(false)} />
            </div>
          )}
          <Link_ to="/web/search">Search</Link_>
          <Link_ to="/web/browse/genre">Browse</Link_>
          <Link_ to="/web/queue">
            Queue {queueCount ? ` (${queueCount})` : ""}
          </Link_>
          <Link_ to="/web/channels">Channels</Link_>
          <Link_ to="/web/stats">
            Settings {dbUpdating ? " (U)" : ""}
          </Link_>
          <div
            className={styles.noConnection}
            style={{ display: connected ? "none" : "block" }}
          >
            Not Connected
          </div>
        </div>
      </div>
    );
  };
  const volIconDim = {
    height: 30,
    width: 50,
    viewBox: "0 150 250 250",
  };
  return (

    <BrowserRouter>
      <div id={styles["app-root"]}>
        <div id={styles["browser-root"]}>
          {smallScreen && (
            <span className={styles["root-nav-button"]}>
              <NavButton onClick={() => setDrawer(true)} />
              <span>{queueCount ? `Q: ${queueCount}` : ""}</span>
            </span>
          )}
          <div className={styles.volume}>
            <button onClick={() => mpdQuery("volume -2")}>
              <VolDown {...volIconDim} />
            </button>
            <span>
              <b>{playback.volume}</b>
            </span>
            <button onClick={() => mpdQuery("volume +2")}>
              <VolUp {...volIconDim} />
            </button>
          </div>
          <Switch>
            <Route
              exact
              path="/web"
              render={() => <Redirect to={"/web/search"} />}
            />
            <Route path="/web/search" component={Search} />
            <Route path="/web/browse" component={Browse} />
            <Route path="/web/channels" component={ChannelPage} />
            <Route
              path="/web/artist/:artist"
              render={({ match, history }) => (
                <ArtistPage history={history} {...match.params} />
              )}
            />
            <Route
              path="/web/albumartist/:albumartist/album/:album"
              render={({ match }) => <AlbumPage {...match.params} />}
            />
            <Route path="/web/queue" component={Queue} />
            <Route path="/web/stats" component={StatsPage} />
            <Route path="/web/console" component={MPDConsole} />
          </Switch>
        </div>
        <Nav />
        <PlaybackControls />
        <Snackbar />
      </div>
    </BrowserRouter>
  );
}
