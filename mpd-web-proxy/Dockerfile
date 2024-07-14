FROM golang:1.22

EXPOSE 8000

WORKDIR /app

ARG VERSION='development'

COPY go.mod go.sum ./
COPY *.go ./
COPY gpio/ ./gpio/
COPY art/ ./art/
COPY version/ ./version/

RUN go build -ldflags "-X 'github.com/aspage2/remote/mpd-web-proxy/version.Version=${VERSION}'" -o /app/main

ENTRYPOINT ["/app/main"]
