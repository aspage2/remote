FROM golang:1.22

EXPOSE 8000

WORKDIR /app

ARG VERSION='development'

COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN go build -ldflags "-X 'github.com/aspage2/remote/mpd-web-proxy/internal/version.Version=${VERSION}'" -o /app/main /app/cmd

ENTRYPOINT ["/app/main"]
