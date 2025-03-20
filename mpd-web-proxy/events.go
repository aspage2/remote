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

type Event struct {
	Type    EventType
	Payload string
}

func (ev Event) SSEPayload() string {
	var typ string
	switch ev.Type {
	case EventTypePing:
		typ = "ping"
	case EventTypeMPD:
		typ = "mpd"
	case EventTypeServer:
		typ = "server"
	default:
		typ = "???"
	}
	var payload = ev.Payload
	if payload == "" {
		payload = "none"
	}
	return fmt.Sprintf("event: %s\ndata: %s\n\n", typ, payload)
}

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
