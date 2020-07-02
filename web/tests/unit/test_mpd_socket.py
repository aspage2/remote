import pytest

from remote.mpd_socket import (
    MPDSocket,
    albums_from_data,
    parse_kv_pairs,
    playback_status,
    tracks_from_data,
    PLAYBACK_FIELDS, STANDARD_PLAYBACK_FIELDS, OPTIONAL_PLAYBACK_FIELDS)


class FakeSocket:
    """Mock the MPD service by patching the connecting TCP socket"""

    def __init__(self, payload):
        self._pos = 0
        self._payload = payload

    def send(self, data: bytes) -> int:
        return len(data)

    def recv(self, nbytes):
        if self._pos >= len(self._payload):
            raise ValueError("Read all of payload")
        upper = min(len(self._payload), self._pos + nbytes)
        ret = self._payload[self._pos : upper]
        self._pos += nbytes
        return ret


@pytest.fixture
def patched_mpd_socket(monkeypatch):
    """
    Returns a monkeypatched MPDSocket whose TCP
    connection will receive the given payload
    """

    def func(payload):
        s = MPDSocket("localhost")
        monkeypatch.setattr(s, "_get_socket", lambda: FakeSocket(payload))
        return s

    return func


@pytest.mark.parametrize(
    "payload",
    (
        b"""
        hello: world
        goodbye: world
        OK
        """,
        b"ACK: Not a real command, dummy",
    ),
    ids=["OK response", "ACK response"],
)
def test_mpd_command(patched_mpd_socket, payload):
    sock = patched_mpd_socket(payload)
    assert sock('search "Jim"') == payload.decode()


def test_mpd_status(patched_mpd_socket):
    sock = patched_mpd_socket(
        b"""
        state: play
        volume: 50
        song: 0
        elapsed: 100
        duration: 200
        random: 1
        consume: 1
        OK
        """
    )

    assert sock.status == {
        **{k: None for k in OPTIONAL_PLAYBACK_FIELDS},
        "state": "play",
        "volume": "50",
        "song": "0",
        "elapsed": "100",
        "duration": "200",
        "random": "1",
        "consume": "1",
    }


@pytest.fixture
def mpd_search_output():
    return """
    file: /home/jim/music/myfile.mp3
    Artist: Jim
    AlbumArtist: Jim
    Album: Jim: best of
    Title: Hymns of Jim
    Track: 1
    Time: 100
    Date: 2009
    file: /home/jim/music/myfile2.mp3
    Artist: Joe
    AlbumArtist: Jim
    Album: Jim: best of
    Title: What does it all mean
    Track: 2
    Time: 100
    Date: 2009
    OK
    """


def test_parse_kv_pairs(mpd_search_output):
    assert list(parse_kv_pairs(mpd_search_output)) == [
        ("file", "/home/jim/music/myfile.mp3"),
        ("Artist", "Jim"),
        ("AlbumArtist", "Jim"),
        ("Album", "Jim: best of"),
        ("Title", "Hymns of Jim"),
        ("Track", "1"),
        ("Time", "100"),
        ("Date", "2009"),
        ("file", "/home/jim/music/myfile2.mp3"),
        ("Artist", "Joe"),
        ("AlbumArtist", "Jim"),
        ("Album", "Jim: best of"),
        ("Title", "What does it all mean"),
        ("Track", "2"),
        ("Time", "100"),
        ("Date", "2009"),
    ]


def test_tracks_from_data(mpd_search_output):
    assert list(tracks_from_data(mpd_search_output)) == [
        {
            "artist": "Jim",
            "album": "Jim: best of",
            "albumartist": "Jim",
            "title": "Hymns of Jim",
            "track": "1",
            "time": 100,
            "date": 2009,
        },
        {
            "artist": "Joe",
            "album": "Jim: best of",
            "albumartist": "Jim",
            "title": "What does it all mean",
            "track": "2",
            "time": 100,
            "date": 2009,
        },
    ]


def test_tracks_from_data_skip_bad_date():

    data = """
        file: /a/b
        Artist: a
        Album: b
        Track: 1
        Title: c
        Date: 2018-01-02
        Time: 2
        OK
        """
    assert list(tracks_from_data(data)) == [
        {"artist": "a", "album": "b", "track": "1", "title": "c", "time": 2}
    ]


def test_albums_from_data(mpd_search_output):
    data = list(albums_from_data(mpd_search_output))
    assert len(data) == 1
    alb = data[0]
    assert all(
        alb[k] == v
        for k, v in {
            "albumartist": "Jim",
            "album": "Jim: best of",
            "date": 2009,
            "time": 200,
        }.items()
    )
    assert {"Jim", "Joe"} == set(alb["artists"])


@pytest.mark.parametrize(
    "lines, exp",
    (
        ([f"{k}: hello" for k in PLAYBACK_FIELDS], {k: "hello" for k in PLAYBACK_FIELDS}),
        ([f"{k}: hello" for k in STANDARD_PLAYBACK_FIELDS], {
            **{k: "hello" for k in STANDARD_PLAYBACK_FIELDS},
            **{k: None for k in OPTIONAL_PLAYBACK_FIELDS}
        })
    ),
    ids=["basic", "no song playing"],
)
def test_playback_status(lines, exp):
    assert playback_status("\n".join(lines+["OK\n"])) == exp
