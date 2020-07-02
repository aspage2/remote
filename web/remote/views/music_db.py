import urllib.parse

from flask import Blueprint, jsonify, request

from remote.mpd_socket import albums_from_data, parse_kv_pairs, tracks_from_data
from remote.util import get_mpd

music = Blueprint("music_db", __name__, url_prefix="/data")


STAT_FIELDS = {
    "uptime",
    "playtime",
    "artists",
    "albums",
    "songs",
    "db_playtime",
    "db_update"
}


def the_heuristic(key):
    """Sort alphabetically, ignoring 'the'"""
    key = key.lower()
    stuff = key.split(" ")
    if stuff[0] == "the":
        return " ".join(stuff[1:])
    return key


def date_heuristic(key):
    """Sort by date"""
    return key.get("date", float("inf"))


@music.route("/stats", endpoint="stats_list")
def stats():
    mpd = get_mpd()

    return jsonify({
        k: v
        for k, v in parse_kv_pairs(mpd("stats"))
        if k in STAT_FIELDS
    })


@music.route("/genres", endpoint="genre_list")
def genre_list():
    mpd = get_mpd()
    data = [v for k, v in parse_kv_pairs(mpd("list genre"))]
    return jsonify(data)


@music.route("/albums", endpoint="album_list")
def album_list():
    mpd = get_mpd()
    page_letter = request.args.get("letter", "a").lower()
    cmd = "list album {}group albumartist".format(
        "".join(
            '{} "{}" '.format(k, request.args[k])
            for k in ("genre", "album", "artist", "date")
            if k in request.args
        )
    )

    albums = []
    pair = {}
    get_album = True
    data = mpd(cmd)
    for k, v in parse_kv_pairs(data):
        if get_album and k == "Album":
            pair["album"] = v
            get_album = False
        elif not get_album and k == "AlbumArtist":
            pair["albumartist"] = v
            get_album = True
            albums.append(pair)
            pair = {}
        else:
            get_album = True

    return jsonify(
        [
            album
            for album in albums
            if the_heuristic(album["album"]).startswith(page_letter)
        ]
    )


@music.route("/genre/<path:genre>", methods=["GET"], endpoint="artists_from_genre")
def artists_from_genre(genre):
    mpd = get_mpd()
    genre = urllib.parse.unquote(genre)
    artists = {
        v for k, v in parse_kv_pairs(mpd('list artist genre "{}"'.format(genre)))
    }

    return jsonify({"artists": sorted(artists, key=the_heuristic)})


@music.route(
    "/albumartist/<album_artist>/album/<album>", endpoint="album_info", methods=["GET"]
)
def album_info(album_artist, album):
    mpd = get_mpd()
    cmd = 'find albumartist "{}" album "{}"'.format(album_artist, album)
    return jsonify({"tracks": (list(tracks_from_data(mpd(cmd))))})


@music.route("/artist/<artist>", endpoint="artist_info", methods=["GET"])
def artist_info(artist):
    mpd = get_mpd()
    cmd = 'find artist "{}"'.format(artist)
    return jsonify({"albums": list(albums_from_data(mpd(cmd)))})
