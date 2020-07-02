BCM = 0
BOARD = 1
OUT = 2

bcm_pins = {
    2: 3,
    3: 5,
    4: 7,
    17: 11,
    27: 13,
    22: 15,
    10: 19,
    9: 21,
    11: 23,
    5: 29,
    6: 31,
    13: 33,
    19: 35,
    26: 37,
    14: 8,
    15: 10,
    18: 12,
    23: 16,
    24: 18,
    25: 22,
    8: 24,
    7: 26,
    12: 32,
    16: 36,
    20: 38,
    21: 40,
}

pin_modes = [False] * 40
pin_vals = [False] * 40

curr_mode = None


def setmode(mode):
    global curr_mode
    curr_mode = mode


def setup(pin, mode):
    global curr_mode
    global pin_modes
    if curr_mode == BCM:
        pin = bcm_pins[pin]
    pin -= 1
    if mode == OUT:
        pin_modes[pin] = mode
    else:
        pin_modes[pin] = False


def output(pin, val):
    global curr_mode
    global pin_modes
    if curr_mode == BCM:
        pin = bcm_pins[pin]
    pin -= 1
    pin_vals[pin] = val


def cleanup():
    pass
