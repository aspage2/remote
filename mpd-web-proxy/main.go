package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"

	"github.com/aspage2/remote/mpd-web-proxy/gpio"
)

const (
	ChannelToggle = "toggle"
	ChannelOn = "on"
	ChannelOff = "off"
)

type Server struct {
	Pins []gpio.Pin
	PinState *gpio.PinState
}

func (s *Server) WriteResponse(wr io.Writer) error {
	var envelope struct {
		Active []gpio.PinId `json:"active"`
		Channels []gpio.Pin `json:"channels"`
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
		Pin gpio.PinId `json:"channel_id"`
		Action *string `json:"action"`
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

func  MpdEvents(rw http.ResponseWriter, req *http.Request) {
	fmt.Println("client requested events.")
	defer fmt.Println("client exited")

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

	mpd := Must(net.Dial("tcp", MpdAuthority))
	defer mpd.Close()
	events := startChannelListener(mpd)
	for ev := range getEvents(events, req.Context()) {
		var eventPayload string
		switch ev.Type {
		case EventTypePing:
			eventPayload = "event: ping\ndata: hello\n\n"
		case EventTypeMPD:
			fmt.Printf("MPD event: %s\n", ev.Data)
			eventPayload = fmt.Sprintf("data: %s\n\n", ev.Data)
		}
		_, err := io.WriteString(rw, eventPayload)
		if err != nil {
			fmt.Printf("error sending event to client: %T %s\n", err, err)
			return
		}
		rw.(http.Flusher).Flush()
	}
}

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

func httpServer(s *Server) {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	http.HandleFunc("/go/cmd", MpdCommand)
	http.HandleFunc("/go/events", MpdEvents)
	http.HandleFunc("/go/mpd/version", MpdVersion)
	http.HandleFunc("/go/channels", s.Channels)
	http.ListenAndServe(":8000", nil)
}

func Must[T any](t T, err error) T {
	if err != nil {
		panic(err)
	}
	return t
}

func main() {
	ps, pins, err := gpio.ConfigFromYaml("pins.yaml")
	if err != nil {
		panic(err)
	}
	var s Server
	s.PinState = ps
	s.Pins = pins 
	httpServer(&s)
}
