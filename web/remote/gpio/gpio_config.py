from dataclasses import dataclass, field
from typing import List, Union

import jsonschema
import yaml

try:
    import RPi.GPIO as rp
except RuntimeError:
    import remote.gpio.fakeRPi as rp

GPIO_MODE = {"BCM": rp.BCM, "BOARD": rp.BOARD}
GPIO_LEVEL = {"HIGH": True, "LOW": False}


@dataclass(frozen=True)
class Pin:
    """
    Represents a physical pin on a RPi's GPIO header.

    Args:
        num - The pin number (physical board number or BCM2835 GPIO #
        on_state - whether a pin is considered "ON" when it
                   is LOW (false) or HIGH (true)
    """

    num: int
    on_state: bool = field(default=True)


@dataclass(frozen=True)
class Channel(Pin):
    """
    Represents a pin which controls output of an audio channel.
    """

    id: str = field(default="")
    display_name: str = field(default="")

    def __post_init__(self):
        # XXX: This gets around the "can't have non-default fields
        # if parent class has default ones" by type checking after
        # __init__. Could probably be fixed by using the attrs project.
        if "" in (self.id, self.display_name):
            raise ValueError("Channel.id and Channel.display_name must be nonempty")


class GPIOConfig:
    """Contains the configuration information for controlling channel output"""

    def __init__(
        self,
        mode: str,
        channels: List[Channel],
        amp_pin: Union[Pin, None] = None,
        max_active_channels=1,
    ):
        self.mode = GPIO_MODE[mode]
        self.max_active_channels = max_active_channels
        self._channels = {p.id: p for p in channels}
        self.amp_pin = amp_pin

    def __getitem__(self, ind):
        return self._channels[ind]

    @property
    def channels(self):
        return list(self._channels.values())

    @staticmethod
    def from_yaml(filename):
        with open(filename, "r") as f:
            config = yaml.load(f, Loader=yaml.SafeLoader)
        validate_pinout(config)
        if "amp" in config:
            amp_pin = Pin(
                num=config["amp"]["pin"],
                on_state=GPIO_LEVEL[config["amp"].get("onState", "HIGH")],
            )
        else:
            amp_pin = None
        mode = config["mode"]
        channels = [
            Channel(
                id=pin["id"],
                num=pin["pin"],
                display_name=pin["name"],
                on_state=GPIO_LEVEL[pin.get("onState", "HIGH")],
            )
            for pin in config["channels"]
        ]
        return GPIOConfig(mode, channels, amp_pin, config.get("maxActiveChannels", 1))


PINOUT_SCHEMA = {
    "$schema": "http://github.com/aspage2/remote-web/pinout-schema",
    "type": "object",
    "properties": {
        "maxActiveChannels": {"type": "integer"},
        "mode": {"type": "string", "enum": ["BCM", "BOARD"]},
        "amp": {
            "type": "object",
            "properties": {
                "pin": {"$ref": "#/definitions/pinNumber"},
                "onState": {"$ref": "#/definitions/onState"},
            },
            "required": ["pin"],
            "additionalProperties": {},
        },
        "channels": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "pin": {"$ref": "#/definitions/pinNumber"},
                    "name": {"type": "string"},
                    "onState": {"$ref": "#/definitions/onState"},
                },
                "required": ["id", "pin", "name"],
                "additionalProperties": {},
            },
        },
    },
    "required": ["mode", "channels"],
    "definitions": {
        "pinNumber": {"type": "integer"},
        "onState": {"type": "string", "enum": ["HIGH", "LOW"]},
    },
    "additionalProperties": {},
}


def validate_pinout(pinout):
    try:
        jsonschema.validate(pinout, PINOUT_SCHEMA)
    except jsonschema.ValidationError as e:
        raise InvalidPinoutError from e


class InvalidPinoutError(Exception):
    pass
