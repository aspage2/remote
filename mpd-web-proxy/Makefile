
VERSION = $(shell git describe --exact-match --match='v[0-9].*' HEAD 2>/dev/null || git rev-parse --short  HEAD)

build/mpd-web-proxy: $(wildcard **/*.go *.go)
	go build -ldflags="-X 'github.com/aspage2/remote/mpd-web-proxy.Version=$(VERSION)'" -o build/mpd-web-proxy .
