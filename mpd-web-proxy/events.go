package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"strings"
	"time"
)

type EventType int

const (
	EventTypeUnset EventType = iota
	EventTypePing
	EventTypeServer
	EventTypeMPD
)

// An Event contains information about something
// that happened on the proxy that may be of interest
// to the frontend.
type Event struct {
	Type    EventType
	Payload string
}

// SSEPayload formats the given Event
// as a Server-Sent Event payload
func (ev Event) SSEPayload() string {
	var sb strings.Builder
	var typ string
	switch ev.Type {
	case EventTypePing:
		typ = "ping"
	case EventTypeMPD:
		typ = "mpd"
	case EventTypeServer:
		typ = "server"
	default:
		typ = ""
	}
	if typ != "" {
		fmt.Fprintf(&sb, "event: %s\n", typ)
	}
	fmt.Fprintf(&sb, "data: %s\n", ev.Payload)
	return sb.String() + "\n"
}

// The MPPIdler opens a connection to the MPD
// server and receives real-time updates using the
// `idle` command. All updates returned to the idler
// are published to the given topic as an `mpd:{type}`
// event.
//
// If the "idle" loop fails due to a dropped connection
// or otherwise, the idler logs a "server:mpd-connection-lost"
// event and tries to re-create the connection. After re-
// connecting, the idler sends a `server:mpd-connected`
// event and continues idling.
func MPDIdler(tpc *Topic[Event]) {
	oneRound := func() error {
		slog.Info("start idler")
		defer slog.Info("stop idler")
		mpd, err := net.Dial("tcp", MpdAuthority)
		if err != nil {
			return err
		}
		defer mpd.Close()
		tpc.Publish(Event{
			Type:    EventTypeServer,
			Payload: "mpd-connected",
		})
		return mpdIdle(mpd, tpc)
	}
	for {
		err := oneRound()
		tpc.Publish(Event{
			Type:    EventTypeServer,
			Payload: "mpd-connection-lost",
		})
		slog.Error("idler exited", "error", err)
		time.Sleep(2 * time.Second)
	}
}

// the MPDIdler continually calls the `idle` MPD
// command and sends idle events on the returned
// string channel.
func mpdIdle(mpd net.Conn, tpc *Topic[Event]) error {
	rd := bufio.NewReader(mpd)
	_, err := rd.ReadString('\n')
	if err != nil {
		return err
	}
	for {
		_, err := io.WriteString(mpd, "idle\n")
		if err != nil {
			return err
		}
		for {
			line, err := rd.ReadString('\n')
			if err != nil {
				return err
			}
			line = strings.TrimSpace(line)
			if line == "OK" {
				break
			}
			parts := strings.SplitN(line, ":", 2)
			if len(parts) != 2 {
				return errors.New("MPD returned strange response: " + line)
			}
			ev := strings.TrimSpace(parts[1])
			tpc.Publish(Event{
				Type:    EventTypeMPD,
				Payload: ev,
			})
		}
	}
}

// getEvents wraps the given Topic[Event] with a ticker
// that sends a `ping` event every 5 seconds.
func getEvents(tpc *Topic[Event], ctx context.Context) chan Event {
	ret := make(chan Event)
	go func() {
		defer close(ret)
		ts := tpc.Subscribe()
		defer tpc.Unsubscribe(ts)
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		ret <- Event{Type: EventTypePing}
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				ret <- Event{Type: EventTypePing}
			case t := <-ts:
				ret <- t
			}
		}
	}()
	return ret
}
