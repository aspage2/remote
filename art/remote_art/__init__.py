

import os
from shutil import copyfile

from flask import Flask, abort, send_file, send_from_directory
from .mpd_socket import MPDSocket

from .utils import absolute_image_path, get_album_files_from_mpd, look_for_image_in_dir, get_image_from_apic

app = Flask(__name__)

app.config['ALBUM_STORE'] = "/data/store"
app.config['MUSIC_DIR'] = "/data/music"
app.config['MPD_HOST'] = os.environ.get("MPD_HOST")

mpd = MPDSocket(app.config['MPD_HOST'])


@app.route("/art/<albumartist>/<album>", methods=["GET"])
def album_art(albumartist, album):
    albumartist = albumartist.lower()
    album = album.lower()

    hash_dir = absolute_image_path(albumartist, album)
    hash_filename = os.path.join(hash_dir, "cover.jpg")

    # Return an already-processed image
    if os.path.exists(hash_filename):
        return send_file(hash_filename)
        
    mp3_files = get_album_files_from_mpd(albumartist, album, mpd)
    if len(mp3_files) == 0:
        abort(404, f"not a pair in MPD: {albumartist} & {album}")

    for fname in mp3_files:
        try:
            image_obj = get_image_from_apic(fname)
            if image_obj:
                os.makedirs(hash_dir, exist_ok=True)
                image_obj.convert("RGB").save(hash_filename)
                return send_file(hash_filename)
        except Exception as e:
            print(e)

        image_file = look_for_image_in_dir(fname)
        if image_file:
            os.makedirs(hash_dir)
            copyfile(image_file, hash_filename)
            return send_file(hash_filename)

    abort(404)


@app.route("/notfound.jpg")
def not_found():
    return send_from_directory("static", "notfound.png") 
