package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path"
	"runtime/debug"
	"strings"

	"github.com/aspage2/remote/mpd-web-proxy/art"
	"github.com/aspage2/remote/mpd-web-proxy/gpio"
	"github.com/aspage2/remote/mpd-web-proxy/version"
)

const (
	ChannelToggle = "toggle"
	ChannelOn     = "on"
	ChannelOff    = "off"
)

type Server struct {
	Pins          []gpio.Pin
	PinState      *gpio.PinState
	MPDStateTopic *Topic[Event]
}

func (s *Server) WriteResponse(wr io.Writer) error {
	var envelope struct {
		Active   []gpio.PinId `json:"active"`
		Channels []gpio.Pin   `json:"channels"`
	}
	envelope.Channels = s.Pins
	envelope.Active = s.PinState.ActiveChannels()
	if envelope.Active == nil {
		envelope.Active = make([]gpio.PinId, 0)
	}
	return json.NewEncoder(wr).Encode(&envelope)
}

func (s *Server) PutChannel(rw http.ResponseWriter, req *http.Request) error {
	var envelope struct {
		Pin    gpio.PinId `json:"channel_id"`
		Action *string    `json:"action"`
	}
	defer req.Body.Close()
	err := json.NewDecoder(req.Body).Decode(&envelope)
	if err != nil {
		WriteBadRequest(rw, fmt.Sprintf("bad json: %s", err.Error()))
		return err
	}
	if envelope.Action == nil {
		envelope.Action = new(string)
		*envelope.Action = ChannelToggle
	}
	var action func(gpio.PinId) error
	action = s.PinState.Toggle
	switch *envelope.Action {
	case "sys_off":
		action = func(_ gpio.PinId) error {
			return s.PinState.SystemOff()
		}
	case ChannelToggle:
		action = s.PinState.Toggle
	case ChannelOn:
		action = s.PinState.On
	case ChannelOff:
		action = s.PinState.Off
	}
	err = action(envelope.Pin)
	if err != nil {
		WriteBadRequest(rw, err.Error())
		return err
	}
	return nil
}

func (s *Server) Channels(rw http.ResponseWriter, req *http.Request) {
	if req.Method == http.MethodPost {
		err := s.PutChannel(rw, req)
		if err != nil {
			return
		}
	}
	s.WriteResponse(rw)
}

func WriteBadRequest(rw http.ResponseWriter, msg string) {
	rw.WriteHeader(http.StatusBadRequest)
	fmt.Fprintf(rw, "ACK: %s\n", msg)
}

// Use server-sent events (SSE) to notify the client in
// real time when the MPD server state has changed. Internally,
// uses the mpd "idle" command and sends idle values as event
// data to the client.
//
// Additionally, the endpoint will deliver "ping" events on
// a set interval as a sort of heartbeat.
func (s *Server) MpdEvents(rw http.ResponseWriter, req *http.Request) {
	slog.Info(fmt.Sprintf("%s %s", req.RemoteAddr, req.URL))
	defer slog.Info(fmt.Sprintf("%s %s CLIENT EXIT", req.RemoteAddr, req.URL))

	hdr := rw.Header()
	hdr.Set("Content-Type", "text/event-stream")
	hdr.Set("Connection", "keep-alive")
	hdr.Set("Cache-Control", "no-cache")
	hdr.Set("X-Accel-Buffering", "no")

	// Force a read, which triggers the HTTP server to
	// notice client disconnections.
	go func() {
		io.Copy(io.Discard, req.Body)
	}()

	for ev := range getEvents(s.MPDStateTopic, req.Context()) {
		eventPayload := ev.SSEPayload()
		_, err := io.WriteString(rw, eventPayload)
		if err != nil {
			slog.Error(
				fmt.Sprintf("error sending event to client: %T %s\n", err, err),
			)
			return
		}
		rw.(http.Flusher).Flush()
	}
}

// MpdCommand is an endpoint which sends the client query
// to MPD and returns the MPD response in the HTTP body.
func MpdCommand(rw http.ResponseWriter, req *http.Request) {
	qs, ok := req.URL.Query()["q"]
	if !ok {
		WriteBadRequest(rw, "query parameter `q` not defined")
		return
	}
	q := qs[0]
	data := Must(MpdQuery(q))
	rw.Write(data)
}

// Returns the verson of the MPD server being used.
func MpdVersion(rw http.ResponseWriter, req *http.Request) {
	conn := Must(net.Dial("tcp", MpdAuthority))
	defer conn.Close()

	data := Must(bufio.NewReader(conn).ReadString('\n'))
	parts := strings.SplitN(data, " ", 3)
	payload := struct {
		Version string `json:"version"`
	}{Version: parts[2]}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(&payload)
}

func chooseAFile(sc *bufio.Scanner) (string, error) {
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "OK" {
			return "", errors.New("no file label. how???")
		}
		parts := strings.Split(line, ": ")
		if len(parts) == 2 && parts[0] == "file" {
			return parts[1], nil
		}
	}
	return "", sc.Err()
}

// The AlbumArt endpoint searches in the album directory
// or the ID3 tags in one of the track files for the album.
func AlbumArt(rw http.ResponseWriter, req *http.Request) {
	conn := Must(net.Dial("tcp", MpdAuthority))
	defer conn.Close()

	sc := bufio.NewScanner(conn)
	sc.Scan() // MPD header
	if sc.Err() != nil {
		panic(sc.Err())
	}
	Must(fmt.Fprintf(conn, "search albumartist \"%s\" album \"%s\"\n", req.PathValue("albumartist"), req.PathValue("album")))
	fname, err := chooseAFile(sc)
	if err != nil {
		rw.WriteHeader(404)
		return
	}
	fullPath := path.Join(MusicDir, fname)
	fullDir, _ := path.Split(fullPath)
	img, err := art.FindFolderImage(fullDir)
	if err != nil {
		panic(err)
	}
	if img != "" {
		fmt.Println("found file:", img)
		rw.Header().Set("Content-Type", "image/jpeg")
		f := Must(os.Open(img))
		io.Copy(rw, f)
		return
	}
	mime, data, err := art.FindAPICInMP3(fullPath)
	if err != nil {
		rw.WriteHeader(404)
		return
	}
	rw.Header().Set("Content-Type", mime)
	io.Copy(rw, bytes.NewReader(data))
}

// Build the server.
func httpServer(s *Server) {
	var nonEventMux http.ServeMux
	nonEventMux.HandleFunc("/go/version", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(struct {
			Version string `json:"version"`
		}{version.Version})
	})
	nonEventMux.HandleFunc("/go/cmd", MpdCommand)
	nonEventMux.HandleFunc("/go/mpd/version", MpdVersion)
	nonEventMux.HandleFunc("/go/channels", s.Channels)
	nonEventMux.HandleFunc("/go/art/{albumartist}/{album}", AlbumArt)

	http.Handle("/go/", loggingMiddleware(&PanicCatchall{&nonEventMux}))
	http.Handle("/go/events", &PanicCatchall{http.HandlerFunc(s.MpdEvents)})

	http.ListenAndServe(BindAddr, nil)
}


// If PanicCatchall recovers a panicked thread, returns a 500
// internal server error to the client.
type PanicCatchall struct {
	handler http.Handler
}

func (this *PanicCatchall) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	defer func() {
		r := recover()
		if r != nil {
			rw.WriteHeader(500)
			var envelope struct {
				Message string
				Trace string
			}
			switch s := r.(type) {
			case error:
				envelope.Message = s.Error()
			case fmt.Stringer:
				envelope.Message = s.String()
			default:
				envelope.Message = fmt.Sprintf("%v", s)
			}
			envelope.Trace = string(debug.Stack())
			fmt.Fprintf(os.Stderr, "%s - %s\n", envelope.Message, envelope.Trace)
			json.NewEncoder(rw).Encode(&envelope)
		}
	}()
	this.handler.ServeHTTP(rw, req)
}

// Panic on any error.
func Must[T any](t T, err error) T {
	if err != nil {
		panic(err)
	}
	return t
}

func main() {
	ps, pins, err := gpio.ConfigFromYaml(PinFile)
	if err != nil {
		panic(err)
	}
	var s Server
	s.PinState = ps
	s.Pins = pins
	s.MPDStateTopic = NewTopic[Event]()
	go MPDIdler(s.MPDStateTopic)
	httpServer(&s)
}
