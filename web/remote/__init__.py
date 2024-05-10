import asyncio
import os

from fastapi import FastAPI, HTTPException, Request

from remote.gpio.controller import GPIOException
from remote.util import get_gpio

MPD_HOST = os.environ.get("MPD_HOST", "localhost")
GPIO_ACTIONS = {
    "toggle": lambda name: gpio.toggle(name),
    "on": lambda name: gpio.set_channel(name),
    "off": lambda name: gpio.unset_channel(name),
}

app = FastAPI()

gpio = get_gpio()
gpio_lock = asyncio.Lock()


def bad_request(reason=""):
    return HTTPException(status_code=400, detail=reason)


@app.get("/gpio/channels")
def gpio_channels():
    return gpio.to_dict()


@app.post("/gpio/channels")
async def set_channel(req: Request):
    data = await req.json()

    action = data.get("action", "toggle").lower()

    channel_id = data.get("channel_id")
    if channel_id is None:
        if action == "sys_off":
            gpio.sys_off()
            return gpio.to_dict()
        raise bad_request("missing_field: channel_id")
    elif channel_id not in gpio:
        raise bad_request(f"no channel with name {channel_id}")

    if action not in GPIO_ACTIONS:
        raise bad_request(f"invalid action: {action}")

    try:
        GPIO_ACTIONS[action](channel_id)
    except GPIOException as e:
        raise bad_request(str(e))

    return gpio.to_dict()

