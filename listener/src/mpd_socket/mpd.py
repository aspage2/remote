import socket
import time

from .utils import parse_kv_pairs, tracks_from_data, playback_status

BUF_SIZE = 1024


class MPDSocket:
    """Socket that reconnects on a lost connection"""

    def __init__(self, host):
        self._host = host
        self._s = None

    def _make_new_socket(self):
        if self._s is not None:
            self._s.close()

        self._s = socket.socket()
        success = False
        while not success:
            try:
                self._s.connect((self._host, 6600))
            except Exception as e:
                print(f"Could not connect: {type(e)} {e}")
                time.sleep(1)
            else:
                success = True
        self._s.recv(32)
        return

    def command(self, cmd):
        """Send a command and receive its output"""
        if not self._s:
            self._make_new_socket()
        self._s.send(f"{cmd.strip()}\n".encode())

        resp = bytearray()
        while not (resp.startswith(b"ACK") or resp.strip().endswith(b"OK")):
            buff = self._s.recv(BUF_SIZE)
            if len(buff) == 0:
                print("WARN: lost connection. Reconnecting.")
                self._make_new_socket()
                self._send(cmd)
            else:
                resp.extend(buff)
        return resp.decode()

    def _send(self, cmd):
        """MPD-compliant send command"""
        self._s.send(f"{cmd.strip()}\n".encode())

    def wait_for_change(self):
        resp = self.command("idle")

        try:
            _, v = next(parse_kv_pairs(resp))
        except Exception as e:
            v = None
        return v

    def close(self):
        if self._s is not None:
            self._s.close()

    @property
    def status(self):
        return playback_status(self.command("status"))

    @property
    def queue(self):
        return list(tracks_from_data(self.command("playlistinfo")))
