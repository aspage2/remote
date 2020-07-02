from decouple import config

from mpd_socket import MPDSocket


if __name__ == "__main__":
    from flask_socketio import SocketIO

    redis = config("REDIS_HOST", 'localhost')
    socketio = SocketIO(message_queue=f"redis://{redis}:6379")

    mpd = config("MPD_HOST", "localhost")
    s = MPDSocket(config('MPD_HOST', 'localhost'))

    try:
        while True:
            changed = s.wait_for_change()
            print(changed)
            if changed in ['playlist', 'player', 'mixer', 'options', 'update', 'database']:
                socketio.emit('status', s.status)
            if changed == 'playlist':
                socketio.emit('queue', s.queue)
            if changed == 'update':
                socketio.emit('update', s.status.get("updating_db") is not None)
    except KeyboardInterrupt:
        s.close()

