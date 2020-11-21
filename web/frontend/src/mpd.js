/**
 * Utilities issuing MPD commands/queries via `/ws/mpd/command`
 */

export function mpdQuery(command) {
    const ws = new WebSocket(`ws://${location.host}/ws/mpd/command`);
    return new Promise((resolve, reject) => {
        setTimeout(()=>reject(), 5000);
        ws.onmessage = function(ev) {
            resolve(ev.data);
        };
        ws.onopen = function() {ws.send(command)};
    }).finally(()=>{

        ws.close()
    });
}

export function* parsePairs(data) {
    for (const line of data.trim().split("\n")) {
        const ind = line.indexOf(": ");
        if (ind !== -1)
            yield [line.substr(0, ind), line.substr(ind+2)]
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
    if (obj !== undefined)
        yield obj;
}

export function albumListFromData(data) {

    const albums = {};

    const _k = ({album, albumartist}) => `${album}_${albumartist}`;

    for (const track of tracksFromData(data)) {
        const key = _k(track);
        if (!albums.hasOwnProperty(key)){
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
    return new Promise(resolve => {
        mpdQuery("playlistinfo").then(res => resolve(Array.from(tracksFromData(res))))
    });
}

export function pullPlaybackInfo() {
    return new Promise(resolve => {
        mpdQuery("status").then(res => resolve(objFromData(res)))
    })
}

const STATUS_UPDATE_TYPES = [
    "playlist", "player", "mixer", "options", "update", "database",
];
const PLAYLIST_UPDATE_TYPES = [
    "playlist",
];
const DB_UPDATE_TYPES = [
    "update",
];
const CHANNEL_UPDATE_TYPES = [
    "gpiochannel",
]

export function startMpdWatcher(setStatus, setQueue, onDBUpdate) {
    const ws = new WebSocket(`ws://${location.host}/ws/mpd/idle`);

    ws.onmessage = function(ev) {
        const changedList = JSON.parse(ev.data);
        let updateStatus = false, updateQueue = false, updateDB = false, updateChannels = false;

        for (const changed of changedList) {
            if (STATUS_UPDATE_TYPES.includes(changed)) {
                updateStatus = true;
            }
            if (PLAYLIST_UPDATE_TYPES.includes(changed)) {
                updateQueue = true;
            }
            if (DB_UPDATE_TYPES.includes(changed)) {
                updateDB = true;
            }
            if (CHANNEL_UPDATE_TYPES.includes(changed)) {
                updateChannels = true;
            }
        }
        if (updateStatus) {
            pullPlaybackInfo().then(setStatus);
        }
        if (updateQueue) {
            pullQueueInfo().then(setQueue);
        }
        if (updateDB) {
            onDBUpdate()
        }
    }
}