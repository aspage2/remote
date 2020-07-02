def parse_kv_pairs(mpd_data):
    """Yield all pairs from an MPD output. Discard the 'OK' line"""
    for line in mpd_data.strip().split("\n"):
        pair = line.strip().split(":", 1)
        if len(pair) == 2:
            yield (x.strip() for x in pair)


def tracks_from_data(data):
    """generate JSON representations of tracks"""
    track = None
    for k, v in parse_kv_pairs(data):
        k = k.lower()
        if k == "file":
            if track is not None:
                yield track
            track = {}
        else:
            track[k] = v
    if track is not None:
        yield track


def playback_status(data):
    """Return a JSON instance describing playback information:
        - state - play/pause
        - volume - %
        - random - 'shuffle' (T/F)
        - consume - delete song from playlist when complete (T/F)"""
    ret = {"song": None, "time": None}
    for k, v in parse_kv_pairs(data):
        ret[k] = v

    return ret
