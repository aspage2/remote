
# Remote

Remote is a web interface for the [Music Player Daemon (MPD)](https://www.musicpd.org/).

This is the webserver portion of the full **Remote System**. Additional components:

 * [remote-art](https://github.com/aspage2/remote-art) - Album art imageserver
 * [remote-listener](https://github.com/aspage2/remote-listener) - Daemon service which broadcasts MPD state changes

## Features (2019-12-08)

**Supported MPD Features**
 * Crucial playback controls: play/pause, next, previous, volume
 * Queue addition, per-track removal & queue clearing
 * Search by artist/album/track

**Additional Features**
 * Configurable access to the GPIO pins of any Raspberry pi model with a 40-pin GPIO header
 * Album art

## Configuration

The webserver is configured through several environment variables:

Name | Description
-----|------------
`REDIS_HOST` | hostname for redis message broker
`MPD_HOST` | hostname for the music player daemon
`PINOUT_FILE` | path to the channel pinout file (see below)
`ALBUM_ART_URL` | the url clients should use to access the album imageserver

## Channel Control via. GPIO

If the webserver is hosted on any 40-pin-gpio raspberry pi models, it can control those pins to choose speaker output. See `examples/pins.txt` for the structure of pinout files.

Remote also controls your amplifier's power, turning the amp ON when a channel is selected and turning it OFF when no channels are selected.

A webserver's pinout consists of one or more **channels**, i.e. speakers that you can turn on/off. Each channel is identified by a unique name.

### `General` section

 * `General.mode`: one of **BCM** or **BOARD**. Tells remote how to interpret the pin numbers in this file. [pinout info here](https://pinout.xyz/)
 * `General.amp`: Pin # of the AMP pin.

### `Numbers` section

Each entry maps a channel to a pin on the header. The structure is:
```
[Numbers]
<channel_id>=<pin_number>
```

### `Descriptions`

Each entry assigns a user-friendly name to a channel. The structure is:
```
[Descriptions]
<channel_id>=<nice_description>
```
