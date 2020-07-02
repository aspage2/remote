try:
    import RPi.GPIO as rp
except RuntimeError:
    import remote.gpio.fakeRPi as rp

from remote.gpio.gpio_config import GPIOConfig, Pin


class GPIOException(Exception):
    pass


class GPIOController:
    """
    Interface layer between client code and the GPIO header on a raspberry pi.
    Behaves according to the GPIOConfig object given to it on initialization.
    Acts as a layer of abstraction for managing & controlling the GPIO state.
    """

    def __init__(self, config: GPIOConfig):
        self._config = config
        self._state = {}
        self._amp_state = False

        rp.setmode(config.mode)
        if config.amp_pin is not None:
            rp.setup(config.amp_pin.num, rp.OUT)
            self._gpio_set(config.amp_pin, False)

        for channel in config.channels:
            self._state[channel.id] = False
            rp.setup(channel.num, rp.OUT)
            self._gpio_set(channel, False)

    def __del__(self):
        rp.cleanup()

    @property
    def channels(self):
        return [
            {"name": pin.id, "desc": pin.display_name} for pin in self._config.channels
        ]

    def set_channel(self, pin_name):
        # Already on
        if self._state[pin_name]:
            return

        num_active = len(self.active_channels)
        if num_active >= self._config.max_active_channels:
            raise GPIOException(
                "already at maximum active channels "
                f"({self._config.max_active_channels})"
            )

        self.set_amp(True)
        self._state[pin_name] = True
        self._gpio_set(self._config[pin_name], True)

    def unset_channel(self, pin_name):
        # Already off
        if not self._state[pin_name]:
            return
        self._state[pin_name] = False
        if len(self.active_channels) == 0:
            self.set_amp(False)
        self._gpio_set(self._config[pin_name], False)

    def set_amp(self, val: bool):
        if self._config.amp_pin is None or self._amp_state is val:
            return
        self._amp_state = val
        self._gpio_set(self._config.amp_pin, val)

    def sys_off(self):
        """Turn off all channels & the amp"""
        for channel in self.channels:
            self.unset_channel(channel["name"])
        self.set_amp(False)

    @property
    def active_channels(self):
        """Return a list of all channels that are ON"""
        return [pin_name for pin_name, state in self._state.items() if state is True]

    def toggle(self, pin_name):
        if self._state[pin_name]:
            self.unset_channel(pin_name)
        else:
            self.set_channel(pin_name)

    @staticmethod
    def _gpio_set(pin: Pin, value: bool):

        # XOR'ing against onState will set the pin
        # to the correct level while still maintaining that
        # True == "ON" to client code. We need to invert
        # onState because True ^ True is False, when we would want
        # it to be true.
        rp.output(pin.num, value ^ (not pin.on_state))
