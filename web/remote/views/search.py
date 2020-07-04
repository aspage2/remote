from flask import Blueprint, abort, jsonify, request

from remote import get_mpd
from remote.mpd_socket import albums_from_data, parse_kv_pairs, tracks_from_data

TRACK_PAGE_SIZE = 10

search = Blueprint("search", __name__, url_prefix="/search")


@search.route("", methods=["GET"], endpoint="search")
def run_search():
    mpd = get_mpd()
    query = request.args.get("query", None)
    page = None

    try:
        page = int(request.args.get("page", 1)) - 1
    except ValueError:
        abort(400, "'page' must be an integer")

    if not query:
        abort(400, "No Query")

    if page < 0:
        abort(400, "Invalid pagination: {}".format(page))

    results = {}
    cmd = 'search artist "{}"'.format(query)
    artists = {v for k, v in parse_kv_pairs(mpd(cmd)) if k.lower() == "artist"}
    results["artist"] = [{"artist": a} for a in artists]

    cmd = 'search album "{}"'.format(query)
    results["album"] = albums_from_data(mpd(cmd))

    cmd = 'search title "{}" window {}:{}'.format(
        query, TRACK_PAGE_SIZE * page, TRACK_PAGE_SIZE * page + TRACK_PAGE_SIZE
    )
    results["track"] = list(tracks_from_data(mpd(cmd)))

    return jsonify({"results": results})
