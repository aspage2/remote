import urls from "../urls";
import React from "react";
import { Link, Route, Switch } from "react-router-dom";

import map from "lodash/map";

import { useMPDQuery } from "../hooks";
import { parsePairs } from "../mpd";

import styles from "./Style.scss";

function GenreList() {
  const { loaded, err, data } = useMPDQuery("list genre");
  if (!loaded) return <div />;
  if (err) {
    return <h3>Error occurred: {JSON.stringify(err)}</h3>;
  }
  return (
    <>
      <h1>Genres</h1>
      <div className={styles.list}>
        {map(Array.from(parsePairs(data)), ([_, v]) => (
          <div key={v} className={styles.list}>
            <Link to={urls.browseGenrePage({ genre: v })}>{v}</Link>
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
    `list albumartist genre \"${genreName}\"`
  );
  if (!loaded) return <div />;
  if (err) {
    return <h3>Error occurred: {JSON.stringify(err)}</h3>;
  }

  return (
    <>
      <h1>Artists for {genreName}</h1>
      <div className={styles.list}>
        {map(Array.from(parsePairs(data)), ([_, v]) => (
          <div key={v}>
            <Link to={urls.artistPage({ artist: v })}>{v}</Link>
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
