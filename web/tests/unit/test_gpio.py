from pathlib import Path

import pytest

import remote.gpio.fakeRPi as rp
from remote.gpio.controller import GPIOController, GPIOException
from remote.gpio.gpio_config import (
    Channel,
    GPIOConfig,
    InvalidPinoutError,
    Pin,
    validate_pinout,
)


@pytest.fixture
def single_channel_config():
    """Shared GPIO config for several tests"""
    return GPIOConfig(
        mode="BCM",
        channels=[
            Channel(id="chan1", num=10, display_name="Channel 1",),
            Channel(id="chan2", num=11, display_name="Channel 2", on_state=False),
        ],
        amp_pin=Pin(num=12),
    )


@pytest.fixture
def basic_yaml_config_filename(pytestconfig):
    """File name of the good config with an amp pin"""
    return str(Path(pytestconfig.rootdir, "tests/unit/good_configs/with_amp.yaml"))


@pytest.fixture
def patched_controller(monkeypatch):
    """
    Instantiates a GPIOcontroller with the supplied config. Patches the `output`
    GPIO call to track the physical (high/low) pin states as they would be in practice.
    """

    def func(config):
        import remote.gpio.controller as cont

        pin_state = {}

        def fake_output(pin, value):
            nonlocal pin_state
            pin_state[pin] = value

        monkeypatch.setattr(cont.rp, "output", fake_output)
        return pin_state, cont.GPIOController(config=config)

    return func


def test_gpio_controller_channel_cycle(patched_controller):
    config = GPIOConfig(
        mode="BCM",
        channels=[
            Channel(id="chan1", num=10, display_name="Channel 1",),
            Channel(id="chan2", num=11, display_name="Channel 2", on_state=False),
        ],
        amp_pin=Pin(num=12),
        max_active_channels=2
    )
    state, c = patched_controller(config)

    def pin_is(pin, st):
        return (state[pin.num] ^ (not pin.on_state)) is st

    assert all(pin_is(c, False) for c in config.channels)
    assert pin_is(config.amp_pin, False)

    c.set_channel("chan1")
    assert pin_is(config['chan1'], True)
    assert pin_is(config.amp_pin, True)
    assert pin_is(config['chan2'], False)

    c.set_channel("chan2")
    assert all(pin_is(c, True) for c in config.channels)
    assert pin_is(config.amp_pin, True)

    c.unset_channel("chan1")
    assert pin_is(config['chan1'], False)
    assert pin_is(config.amp_pin, True)
    assert pin_is(config['chan2'], True)

    c.unset_channel("chan2")
    assert all(pin_is(c, False) for c in config.channels)
    assert pin_is(config.amp_pin, False)


def test_gpio_controller_channels(single_channel_config):
    assert GPIOController(single_channel_config).channels == [
        {"name": "chan1", "desc": "Channel 1"},
        {"name": "chan2", "desc": "Channel 2"},
    ]


def test_sys_off(patched_controller, single_channel_config):
    """sys_off should turn all allocated channels to their "off" state"""
    state, c = patched_controller(single_channel_config)
    c.sys_off()
    assert state == {
        single_channel_config.amp_pin.num: not single_channel_config.amp_pin.on_state,
        **{p.num: not p.on_state for p in single_channel_config.channels},
    }


def test_controller_set(single_channel_config):
    """The controller should correctly track the logical state of the channels"""
    c = GPIOController(config=single_channel_config)

    c.set_channel("chan1")
    assert c._state == {"chan1": True, "chan2": False}
    assert c._amp_state is True


def test_controller_set_too_many_channels(single_channel_config):
    """The controller should complain if client code tries to set too many channels"""
    c = GPIOController(config=single_channel_config)
    c.set_channel("chan1")
    with pytest.raises(GPIOException):
        c.set_channel("chan2")


def test_config_from_yaml(basic_yaml_config_filename):
    """The GPIOConfig factory should correctly instantiate a GPIOConfig"""
    c = GPIOConfig.from_yaml(basic_yaml_config_filename)
    assert c.mode == rp.BCM
    assert c.max_active_channels == 1
    assert c.amp_pin == Pin(33, True)
    assert c.channels == [Channel(4, True, "fam", "Family Room")]


def test_controller_on_state(patched_controller):
    """
    The controller should make the correct GPIO calls for
    setting/unsetting channels according to on state
    """
    state, c = patched_controller(
        GPIOConfig(channels=[Channel(10, False, "chan1", "Channel 1")], mode="BCM")
    )
    c.set_channel("chan1")
    assert state[10] is False
    c.unset_channel("chan1")
    assert state[10] is True


def test_config_validation(good_channel_config):
    """The gpio config jsonschema should accept all good configs"""
    fail_message = None
    try:
        validate_pinout(good_channel_config)
    except InvalidPinoutError as e:
        fail_message = str(e.__cause__)
    finally:
        assert fail_message is None, fail_message


def test_bad_config_validation(bad_channel_config):
    """The gpio config jsonschema should invalidate all bad configs"""
    with pytest.raises(InvalidPinoutError):
        validate_pinout(bad_channel_config)


def test_pin_dataclass():
    """The Pin dataclass should have a default onstate of True (high)"""
    p = Pin(num=3)

    assert p.num == 3
    assert p.on_state is True


def test_channel_dataclass():
    """The Channel dataclass should have a default onstate of True (high)"""
    c = Channel(num=3, id="chan1", display_name="channel 1")
    assert c.num == 3
    assert c.id == "chan1"
    assert c.display_name == "channel 1"
    assert c.on_state is True
