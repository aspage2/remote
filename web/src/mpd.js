
import {Connected, ProxyNotConnected, MPDNotConnected} from "./App/Context";

/**
 * Utilities issuing MPD commands/queries via `/ws/mpd/command`
 */

export async function mpdQuery(command) {
	const path = `/go/cmd?q=${encodeURIComponent(command)}`;
  const resp = await fetch(path);
	if (!resp.ok) {
		const err = new Error(`${path}: ${resp.status} ${resp.statusText}`);
		return Promise.reject(err);
	}
  const data = await resp.text();
	return Promise.resolve(data);
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

export function isDBUpdating({ updating_db }) {
  return !(updating_db === null || updating_db === undefined);
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

export function startMpdWatcher(
  setConnection,
  setPlayback,
  setQueue,
  showSnackbar
) {
  const es = new EventSource("/go/events");
  es.onerror = () => setConnection(ProxyNotConnected);
  es.onopen = () => setConnection(Connected);
	es.addEventListener("mpd", ev => {
    setConnection(Connected);
    const changed = ev.data;
    if (STATUS_UPDATE_TYPES.includes(changed)) {
      pullPlaybackInfo().then(setPlayback);
    }
    if (PLAYLIST_UPDATE_TYPES.includes(changed)) {
      pullQueueInfo().then(setQueue);
    }
    if (DB_UPDATE_TYPES.includes(changed)) {
      pullPlaybackInfo().then(setPlayback);
      showSnackbar("database update");
    }
	});
	es.addEventListener("server", ({data}) => {
		if (data === "mpd-connected") {
			setConnection(Connected);
		} else if (data === "mpd-connection-lost") {
			setConnection(MPDNotConnected);
		}
	});
}
