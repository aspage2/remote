import socket

BUF_SIZE = 512

STANDARD_PLAYBACK_FIELDS = {"state", "volume", "random", "consume"}
OPTIONAL_PLAYBACK_FIELDS = {"song", "elapsed", "duration", "updating_db"}
PLAYBACK_FIELDS = STANDARD_PLAYBACK_FIELDS | OPTIONAL_PLAYBACK_FIELDS

SONG_FIELDS = {
    "artist",
    "album",
    "title",
    "track",
    "date",
    "time",
    "pos",
    "albumartist",
}


class MPDSocket:
    def __init__(self, host):
        self._host = host

    def _get_socket(self):
        """Connect to the MPD instance and flush the greeting"""
        s = socket.socket()
        s.connect((self._host, 6600))
        s.recv(32)  # Header
        return s

    def command(self, cmd):
        """Send a command and receive its output"""
        s = self._get_socket()
        s.send(f"{cmd.strip()}\n".encode())
        resp = bytearray()
        while not (resp.startswith(b"ACK") or resp.strip().endswith(b"OK")):
            buff = s.recv(BUF_SIZE)
            resp.extend(buff)
        return resp.decode()

    def __call__(self, cmd):
        return self.command(cmd)

    def bulk(self, *commands):
        return self.command(
            "command_list_begin\n{}\ncommand_list_end".format("\n".join(commands))
        )

    @property
    def status(self):
        return playback_status(self.command("status"))

    @property
    def queue(self):
        return list(tracks_from_data(self.command("playlistinfo")))


def parse_kv_pairs(mpd_data):
    """Yield all pairs from an MPD output. Discard the 'OK' line"""
    for line in mpd_data.strip().split("\n"):
        pair = line.strip().split(":", 1)
        if len(pair) == 2:
            yield pair[0].strip(), pair[1].strip()


def tracks_from_data(data):
    """generate JSON representations of tracks"""
    track = None
    for k, v in parse_kv_pairs(data):
        k = k.lower()
        if k == "file":
            if track is not None:
                yield track
            track = {}
        elif k in ("time", "date"):
            try:
                track[k] = int(v)
            except ValueError:
                pass
        else:
            track[k] = v
    if track is not None:
        yield track


def playback_status(data):
    """
    Return a JSON instance describing playback information:
      - state - play/pause
      - volume - %
      - random - 'shuffle' (T/F)
      - consume - delete song from playlist when complete (T/F)
    """
    ret = {f: None for f in OPTIONAL_PLAYBACK_FIELDS}
    ret.update({k: v for k, v in parse_kv_pairs(data) if k in PLAYBACK_FIELDS})
    return ret


def albums_from_data(mpd_data):
    """Get all unique albums from MPD output"""
    albums = {}
    for track in tracks_from_data(mpd_data):
        if "albumartist" not in track or "album" not in track:
            continue  # No way to categorize this track
        key = (track["albumartist"], track["album"])
        if key not in albums:
            album = albums[key] = track
            album["time"] = album.get("time", 0)
            album["artists"] = {track["artist"]} if "artist" in track else set()
            for key in ("artist", "title", "track"):
                if album.pop(key, None) is None:
                    pass  # TODO how can we warn about broken tag data?
        else:
            album = albums[key]
            album["time"] += int(track.get("time", 0))
            if "artist" in track:
                album["artists"].add(track["artist"])
    for album in albums.values():
        album["artists"] = list(album["artists"])
    return list(albums.values())
