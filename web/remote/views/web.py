import json

from flask import Blueprint, current_app, render_template

from remote.util import get_gpio

from .playback import system_status

web = Blueprint("web", __name__, url_prefix="/web", static_folder="static")


@web.route("")
@web.route("/<path:path>")
def webpage(path=None):
    return render_template(
        "index.html",
        has_gpio=get_gpio() is not None,
        status=json.dumps(system_status()),
        album_art_url=current_app.config["ALBUM_ART_URL"],
    )


@web.route("/ping/")
def ping():
    return "<h1>PONG</h1><p>Is an underrated esport</p>"
