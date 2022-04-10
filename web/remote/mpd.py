import asyncio
import contextlib

BUF_SIZE = 1024

COMMAND_BLACKLIST = {
    # listall & listallinfo will dump entire library into the socket
    "listall",
    "listallinfo",
    # Use the /art/ interface
    "albumart",
    # Clients should not have this kind of power
    "kill",
    # Clients don't need to see config
    "config",
}


@contextlib.asynccontextmanager
async def open_mpd(hostname, drop_header=True):
    """Open an asyncio stream to the MPD at hostname"""
    reader, writer = await asyncio.open_connection(hostname, 6600)
    try:
        if drop_header:
            await reader.readline()
        yield reader, writer
    finally:
        writer.close()
        await writer.wait_closed()


async def read_mpd_response(reader: asyncio.StreamReader) -> bytes:
    """Read MPD response up to `OK\n` or `ACK`"""

    resp = bytearray(await reader.read(BUF_SIZE))
    while not (resp.endswith(b"OK\n") or resp.startswith(b"ACK")):
        resp.extend(await reader.read(BUF_SIZE))

    return resp
