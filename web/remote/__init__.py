import asyncio
import json
import os
from fastapi import FastAPI, WebSocket, Request, HTTPException
from starlette.endpoints import WebSocketEndpoint

from remote.gpio.controller import GPIOController, GPIOException
from remote.mpd import COMMAND_BLACKLIST, read_mpd_response, open_mpd
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


@app.websocket("/ws/mpd/command")
async def mpd_command(websocket: WebSocket):
    await websocket.accept()

    reader, writer = await open_mpd(MPD_HOST)

    try:
        query = (await websocket.receive_text()).strip()
        if (cmd := query.split(" ", 1)[0]) in COMMAND_BLACKLIST:
            resp = f"ACK: blacklisted: {cmd}"
        else:
            writer.write(f"{query.strip()}\n".encode())
            resp = (await read_mpd_response(reader)).decode()
        await websocket.send_text(resp)
    finally:
        writer.close()
        await writer.wait_closed()
        try:
            await websocket.close()
        except:
            pass


@app.websocket_route("/ws/mpd/idle")
class IdleEndpoint(WebSocketEndpoint):
    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.task = asyncio.create_task(self.idle_loop(websocket))

    async def on_disconnect(self, websocket: WebSocket, close_code: int) -> None:
        self.task.cancel()

    async def idle_loop(self, ws: WebSocket):
        reader, writer = await open_mpd(MPD_HOST)

        try:
            while True:
                writer.write(b"idle\n")
                await writer.drain()
                resp = await read_mpd_response(reader)
                changed = [
                    line.decode().split(": ", 1)[1]
                    for line in resp.strip().split(b"\n")
                    if line != b"OK"
                ]
                await ws.send_text(json.dumps(changed))
        except Exception as e:
            pass
        finally:
            writer.close()
            await writer.wait_closed()
            await ws.close()
