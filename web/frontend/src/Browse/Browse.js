import React from "react";
import { Link, Route, Switch } from "react-router-dom";

import map from "lodash/map";

import { useMPDQuery } from "../urls";
import { parsePairs } from "../mpd";

import styles from "./Style.scss";

function GenreList() {
  const { loaded, err, data } = useMPDQuery("list genre");
  if (!loaded) return <div />;
  if (err) {
    return <h3>Error occurred: {JSON.stringify(error)}</h3>;
  }
  return (
    <>
      <h1>Genres</h1>
      <div className={styles.list}>
        {map(Array.from(parsePairs(data)), ([_, v]) => (
          <div key={v} className={styles.list}>
            <Link to={`/web/browse/genre/${encodeURIComponent(v)}`}>{v}</Link>
          </div>
        ))}
      </div>
    </>
  );
}

function GenrePage(props) {
  const { match } = props;
  const genreName = decodeURIComponent(match.params.genre);

  const { loaded, err, data } = useMPDQuery(
    `list artist genre \"${genreName}\"`
  );
  if (!loaded) return <div />;
  if (err) {
    return <h3>Error occurred: {JSON.stringify(error)}</h3>;
  }

  return (
    <>
      <h1>Artists for {genreName}</h1>
      <div className={styles.list}>
        {map(Array.from(parsePairs(data)), ([_, v]) => (
          <div>
            <Link to={`/web/artist/${encodeURIComponent(v)}`}>{v}</Link>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Browse(props) {
  const { match } = props;
  return (
    <Switch>
      <Route exact path={`${match.path}/genre`} component={GenreList} />
      <Route path={`${match.path}/genre/:genre`} component={GenrePage} />
    </Switch>
  );
}
