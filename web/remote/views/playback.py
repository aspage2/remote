from flask import Blueprint, abort, jsonify, request

from remote.util import get_gpio, get_mpd

playback = Blueprint("playback", __name__, url_prefix="/playback")


@playback.route("/status", methods=["GET"], endpoint="system_status")
def get_status():
    return system_status()


def system_status():
    """Return util status, including playback, channel, queue and current song"""
    mpd = get_mpd()
    ret = {"playback": mpd.status, "queue": mpd.queue}
    gpio = get_gpio()
    if gpio is not None:
        ret["channel"] = {"pinout": gpio.channels, "status": gpio.active_channels}
    return ret


@playback.route("/queue", methods=["GET", "PUT", "DELETE"], endpoint="queue_operations")
def queue_operations():
    """Modify the queue"""
    mpd = get_mpd()
    if request.method == "PUT":
        if "criteria" not in request.json:
            return {"message": "No Album/Artist/Title specified"}, 400
        try:
            cmd = "findadd {}".format(
                " ".join(
                    '{} "{}"'.format(*item) for item in request.json["criteria"].items()
                )
            )
            mpd(cmd)

        except RuntimeError:
            return {"message": "exception occurred"}, 500

    elif request.method == "DELETE":
        i = str(request.args.get("index", "all")).lower()

        if i == "all":
            cmd = "clear"
        else:
            cmd = "delete {}".format(i)
        try:
            mpd(cmd)
        except RuntimeError:
            return {"message": "MPD did not understand index: {}".format(i)}

    return jsonify(system_status())


@playback.route("", methods=["POST"], endpoint="playback_operations")
def playback_operations():
    """Playback operations: play/pause, volume, etc"""
    mpd = get_mpd()
    if request.json is None:
        return {"message": "Response must be JSON string"}, 400
    json = request.json
    if "playback" in json:
        cmd = json["playback"]
        if cmd not in ("play", "pause", "previous", "next"):
            return {"message": "Invalid playback command: {}".format(cmd)}, 400
        mpd(cmd)
    for cmd in ("random", "shuffle", "consume"):
        if cmd in json:
            cv = json[cmd]
            if isinstance(cv, bool):
                cv = "1" if cv else "0"
            mpd("{} {}".format(cmd, cv))

    if "volume" in json:
        if json["volume"] == "up":
            mpd("volume +10")
        elif json["volume"] == "down":
            mpd("volume -10")

    return jsonify(system_status())


@playback.route("channels", endpoint="audio_channels", methods=["POST"])
def gpio_channels():
    g = get_gpio()
    if g is None:
        abort(400, "GPIO not configured")
    chan = request.json["channel"]
    if chan == "off":
        g.sys_off()
    else:
        try:
            g.toggle(chan)
        except RuntimeWarning:
            abort(400, "Deselect a channel plz ty")

    return jsonify(system_status())
