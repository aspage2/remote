import asyncio

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


async def open_mpd(hostname):
    """Open an asyncio stream to the MPD at hostname"""
    reader, writer = await asyncio.open_connection(hostname, 6600)
    await reader.readline()
    return reader, writer


async def read_mpd_response(reader: asyncio.StreamReader) -> bytes:
    """Read MPD response up to `OK\n` or `ACK`"""

    resp = bytearray(await reader.read(BUF_SIZE))
    while not (resp.endswith(b"OK\n") or resp.startswith(b"ACK")):
        resp.extend(await reader.read(BUF_SIZE))

    return resp
