
# Remote

Web client for the [Music Player Daemon](https://www.musicpd.org/).

## MPD Features Supported by the Frontend
* Playback Controls
  - Play/Pause/Next/Previous
  - Volume Up/Down
  - Consume Mode
  - Shuffle Mode
* Search by Artist, Album and Song Title
* Browsing by Genre
* Managing the "current playlist" i.e. the queue.
* Database control & statistics
* Text console

In addition, the proxy contains a module for controlling GPIO pins on a raspberry
pi to control speakers.

## Architecture

The Music Player Daemon is a headless music player that clients control via
a custom TCP text protocol. Being headless means that anyone can build their own
client to control the server; any application that can open an arbitrary TCP
connection can control MPD.

Unfortunately, this makes browser clients a little more involved, as browsers
prevent arbitrary TCP channels to be opened. For browser clients, the actual
connection must be offloaded onto a helper service that the frontend communicates
with via HTTP. Essentially, this project is an HTTP proxy to the MPD with a web
frontend.

### Proxy Responsibilities

* Serving MPD commands
* Serving art
* Controlling GPIO pins on a raspberry pi.

### Data Model
The relationship between an album, the songs on its album and the artists that 
wrote those songs is complicated. While oftentimes an album is produced by the
artist which also produced the songs (think: Abbey Road by the Beatles,
Dark Side of the Moon by Pink Floyd), MPD must account for things like
**compilation albums**, **collaborations** or the like.

For example, I like the song "November has Come" which features M.F. Doom.
While the song is associated with Doom, it is a Gorillaz song, and it lives
in the Gorillaz album "Demon Days". MF Doom is an artist on an album that
he didn't produce.

So how do we uniquely identify an album in our data model? We can't identify
by name, as album names can clash (think "Best Of" from every established band).
We can't include artist name, as that isn't unique for a physical album.
MP3 taggers have thought about this, so they have introduced an extra field,
the **album artist**, to be a **single** name associated with an album.

This is why, in the frontend, album art and album pages are indexed via
**album artist** and **album**.

## Deployment

### Configuration
The proxy service expects several envvars with reasonable defaults:

* `MPD_AUTHORITY` - the `{hostname}:{port}` to use when connecting to MPD. **default** `localhost:6600`
* `PROXY_PIN_FILE` - location of the yaml file containing GPIO pins to control from the frontend. **default** `/data/pins.yaml`
* `PROXY_BIND_ADDR` - the address to bind to when serving requests. **default** `127.0.0.1:8000`
* `PROXY_MUSIC_DIR` - the directory containing the music library. This is needed for the service to be able to serve art.

## Local Development

Requirements:
 * docker and docker-compose
 * Go
 * yarn

Directories:
 - `fake_mpd` - resources for a local instance of MPD which runs in docker
 - `mpd-web-proxy` - source code to the 
 - `web` - source code for the frontend

### Running a Dev Server

Make the "playlists" directory in `fake_mpd`.

```sh
mkdir fake_mpd/playlists
```

Build the web bundle in "dev" mode. "Dev mode" uses "webpack --watch" to reload the bundle when a change in the source is detected:

```sh
cd web/frontend && yarn build-dev
```

Run the full service with docker-compose:

```sh
docker compose up --build --force-recreate
```

Navigate to `localhost`.

