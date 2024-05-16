/**
 * Utilities issuing MPD commands/queries via `/ws/mpd/command`
 */

import { Actions as PlaybackActions } from "./PlaybackControls";
import { Actions as QueueActions } from "./Queue";
import { Actions as SnackbarActions } from "./Snackbar";
import { Actions as GlobalActions } from "./Ducks";

export async function mpdQuery(command) {
  const resp = await fetch(`/go/cmd?q=${encodeURIComponent(command)}`);
  return await resp.text();
}

export function* parsePairs(data) {
  for (const line of data.trim().split("\n")) {
    const ind = line.indexOf(": ");
    if (ind !== -1) yield [line.substr(0, ind), line.substr(ind + 2)];
  }
}

export function objFromData(data) {
  const ret = {};
  for (const [k, v] of parsePairs(data)) {
    ret[k] = v;
  }
  return ret;
}

export function* tracksFromData(data) {
  let obj = undefined;
  for (const [k, v] of parsePairs(data)) {
    if (k === "file") {
      if (obj !== undefined) {
        yield obj;
      }
      obj = {};
    }
    obj[k.toLowerCase()] = v;
  }
  if (obj !== undefined) yield obj;
}

export function albumListFromData(data) {
  const albums = {};

  const _k = ({ album, albumartist }) => `${album}_${albumartist}`;

  for (const track of tracksFromData(data)) {
    const key = _k(track);
    if (!albums.hasOwnProperty(key)) {
      albums[key] = {
        album: track.album,
        albumartist: track.albumartist,
        time: 0,
        artists: [],
      };
    }
    const alb = albums[key];
    if (track.hasOwnProperty("time")) {
      alb.time += parseInt(track.time);
    }
    if (track.hasOwnProperty("date")) {
      alb.date = track.date;
    }
    if (!alb.artists.includes(track.artist)) {
      alb.artists.push(track.artist);
    }
  }
  return Object.values(albums);
}

export function pullQueueInfo() {
  return new Promise((resolve) => {
    mpdQuery("playlistinfo").then((res) =>
      resolve(Array.from(tracksFromData(res)))
    );
  });
}

export function pullPlaybackInfo() {
  return new Promise((resolve) => {
    mpdQuery("status").then((res) => resolve(objFromData(res)));
  });
}

const STATUS_UPDATE_TYPES = [
  "playlist",
  "player",
  "mixer",
  "options",
  "update",
  "database",
];
const PLAYLIST_UPDATE_TYPES = ["playlist"];
const DB_UPDATE_TYPES = ["update"];

export function startMpdWatcher(dispatch) {
  const es = new EventSource("/go/events");

  es.onerror = () => {
		dispatch(GlobalActions.setConnection(false));
	};

	es.onopen = () => {
		dispatch(GlobalActions.setConnection(true));
	};

	es.addEventListener("ping", () => {
		dispatch(GlobalActions.setConnection(true));
	});
  
  es.onmessage = function (ev) {
		dispatch(GlobalActions.setConnection(true));
    const changed = ev.data;
    if (STATUS_UPDATE_TYPES.includes(changed)) {
      pullPlaybackInfo().then((pb) =>
        dispatch(PlaybackActions.setPlayback(pb))
      );
    }
    if (PLAYLIST_UPDATE_TYPES.includes(changed)) {
      pullQueueInfo().then((q) => dispatch(QueueActions.setQueue(q)));
    }
    if (DB_UPDATE_TYPES.includes(changed)) {
      dispatch(SnackbarActions.showSnackbar("database update"));
    }
  };
}
