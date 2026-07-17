package main

import "os"

var (
	MpdAuthority string
	PinFile      string
	BindAddr     string
	MusicDir     string
)

func init() {
	MpdAuthority = os.Getenv("MPD_AUTHORITY")
	if MpdAuthority == "" {
		MpdAuthority = ":6600"
	}

	PinFile = os.Getenv("PROXY_PIN_FILE")
	if PinFile == "" {
		PinFile = "/data/pins.yaml"
	}

	BindAddr = os.Getenv("PROXY_BIND_ADDR")
	if BindAddr == "" {
		BindAddr = ":8000"
	}

	MusicDir = os.Getenv("PROXY_MUSIC_DIR")
	if MusicDir == "" {
		MusicDir = "/data/music"
	}
}
