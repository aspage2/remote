import eventlet

eventlet.monkey_patch()  # noqa:

from flask import Flask
from flask_socketio import SocketIO, emit

from remote.gpio.controller import GPIOException
from remote.util import get_envvars, get_gpio, get_mpd
from remote.views.music_db import music
from remote.views.playback import playback
from remote.views.search import search
from remote.views.web import web


app = Flask(__name__)

env = get_envvars("REDIS_HOST", "MPD_HOST", "ALBUM_ART_URL", optional=["PINOUT_FILE"], defaults={
    "REDIS_HOST": "localhost",
    "MPD_HOST": "localhost",
    "ALBUM_ART_URL": "localhost",
})
app.config.update(env)

socket_io = SocketIO(app, message_queue=f"redis://{app.config['REDIS_HOST']}:6379")


@socket_io.on("dbUpdate")
def start_db_update():
    mpd = get_mpd()
    mpd("update")


@socket_io.on("playbackCommand")
def playback_command(data: str):
    """Control playback or volume"""

    mpd = get_mpd()
    cmd = data.strip()
    allowed_commands = (
        "volume",
        "previous",
        "next",
        "play",
        "pause",
        "random",
        "consume",
    )
    if any(cmd.startswith(c) for c in allowed_commands):
        mpd(cmd)


@socket_io.on("queueRemove")
def queue_remove_command(data: str):
    """
    Remove a track from the current playlist

    """
    mpd = get_mpd()
    if data.lower() == "all":
        mpd("clear")
    else:
        mpd(f"delete {data}")


@socket_io.on("findadd")
def queue_add_command(data: dict):
    """
    Add a track to the current playlist

    Args:
        data - tag, value pairs (artist, album, title, etc.)
    """
    mpd = get_mpd()
    args = " ".join(f'{k} "{v}"' for k, v in data.items())
    mpd(f"findadd {args}")


@socket_io.on("queueSeek")
def queue_seek_command(pos: str):
    """Select a song for playback"""
    mpd = get_mpd()
    mpd.bulk(f"seek {pos} 0", "play")


@socket_io.on("channel")
def channel_command(chan):
    """Update GPIO channel output"""
    gpio = get_gpio()
    if gpio is None:
        return {"success": False, "message": "No channels set up"}
    chan = chan.lower()
    if chan == "off":
        gpio.sys_off()
    else:
        try:
            gpio.toggle(chan)
        except GPIOException:
            return {"success": False, "message": "Max # channels selected"}
    emit("channel", {"pinout": gpio.channels, "status": gpio.active_channels})
    return {"success": True}


app.register_blueprint(music)
app.register_blueprint(playback)
app.register_blueprint(web)
app.register_blueprint(search)
