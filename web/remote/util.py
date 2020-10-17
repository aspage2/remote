import os

from remote.gpio.controller import GPIOController
from remote.gpio.gpio_config import GPIOConfig

gpio = None
mpd = None


def get_gpio() -> GPIOController:
    """
    Return a singleton instance of a configured GPIO controller

    :return: The GPIOController if PINOUT_FILE exists, else None
    """

    global gpio
    if gpio is None and os.environ.get("PINOUT_FILE") is not None:
        pinout = GPIOConfig.from_yaml(os.environ["PINOUT_FILE"])
        gpio = GPIOController(pinout)

    return gpio


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
