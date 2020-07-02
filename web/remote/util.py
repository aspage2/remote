import os

from flask import current_app

from remote.gpio.controller import GPIOController
from remote.gpio.gpio_config import GPIOConfig
from remote.mpd_socket import MPDSocket

gpio = None
mpd = None


def get_gpio() -> GPIOController:
    """
    Return a singleton instance of a configured GPIO controller

    :return: The GPIOController if PINOUT_FILE exists, else None
    """

    global gpio
    if gpio is None and current_app.config.get("PINOUT_FILE") is not None:
        pinout = GPIOConfig.from_yaml(current_app.config["PINOUT_FILE"])
        gpio = GPIOController(pinout)

    return gpio


def get_mpd() -> MPDSocket:
    """
    Get a singleton instance of an MPD socket
    """
    global mpd

    if mpd is None:
        mpd = MPDSocket(current_app.config["MPD_HOST"])

    return mpd


def get_envvars(*required, optional=None, defaults=None):
    ret = {}
    defaults = defaults or {}
    try:
        for key in required:
            val = os.environ.get(key, defaults.get(key))
            assert val is not None
            ret[key] = val
        for key in optional or []:
            ret[key] = os.environ.get(key)
    except AssertionError as e:
        raise ValueError() from e

    return ret
