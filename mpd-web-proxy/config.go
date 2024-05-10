package main

import "os"

var MpdAuthority string

func init() {
	MpdAuthority = os.Getenv("MPD_AUTHORITY")
	if MpdAuthority == "" {
		MpdAuthority = ":6600"
	}
}
