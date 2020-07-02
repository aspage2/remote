import hashlib
import os
from io import BytesIO

from PIL import Image
from .mpd_socket.utils import parse_kv_pairs

from flask import current_app
from mutagen.mp3 import MP3

Hash_T = str


def get_uuid(albumartist: str, album: str) -> str:
    """UUID from albumartist-album pair"""
    return hashlib.md5(f'{albumartist.lower()}_{album.lower()}'.encode()).hexdigest()


def hash_to_filepath(h: Hash_T) -> str:
    """Relative path from uuid"""
    return "".join(["/".join(h[2*i:2*i+2] for i in range(4)), "/", h[8:]])


def absolute_image_path(albumartist, album) -> str:
    """Absolute path to the image directory"""
    h = get_uuid(albumartist, album)
    return os.path.join(current_app.config['ALBUM_STORE'], hash_to_filepath(h))


def get_single_file_from_mpd(albumartist, album, mpd):
    resp = mpd.command(f"search albumartist \"{albumartist}\" album \"{album}\" window 0:1")
    for k, v in parse_kv_pairs(resp):
        if k == 'file':
            return os.path.join(current_app.config["MUSIC_DIR"], v)
    return None


def look_for_image_in_dir(mp3):
    directory = os.path.dirname(mp3)
    for filename in ("Folder.jpg", "cover.jpg"):
        full_path = os.path.join(directory, filename)
        if os.path.exists(full_path):
            return full_path

    return None


def get_image_from_apic(mp3_file):
    mp3 = MP3(mp3_file)
    if 'APIC:' in mp3.keys():
        return Image.open(BytesIO(mp3["APIC:"].data))
    return None
