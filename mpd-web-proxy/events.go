package main

import (
	"bufio"
	"context"
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
	EventTypeMPD
)

// the MPDIdler continually calls the `idle` MPD 
// command and sends idle events on the returned 
// string channel.
func startMPDIdler(mpd net.Conn) chan string {
	eventC := make(chan string)
	go func() {
		slog.Debug("start MPD Idler")
		defer slog.Debug("end MPD Idler")
		defer close(eventC)
		sc := bufio.NewScanner(mpd)
		// MPD Header
		sc.Scan()

		for {
			io.WriteString(mpd, "idle\n")
			for sc.Scan() {
				line := sc.Text()
				if line == "OK" {
					break
				}
				parts := strings.SplitN(line, ":", 2)
				if len(parts) != 2 {
					slog.Error(fmt.Sprintf("unexpected string: %s\n", line))
					return
				}
				ev := strings.TrimSpace(parts[1])
				slog.Debug(fmt.Sprint("sending event:", ev))
				eventC <- ev
			}
			if err := sc.Err(); err != nil {
				if _, ok := err.(*net.OpError); !ok {
					slog.Error(fmt.Sprintf("unexpected error: %T %s\n", err, err))
				}
				return
			}
		}
	}()
	return eventC
}

// An Event is any asynchronous event 
// that should be sent to a listening client.
type Event struct {
	Type EventType
	Data string
}

// getEvents starts a goroutine which emits events
// to send to the client. Events include:
//   - any string sent on the provided string channel is sent as an MPDEvent
//   - the emitter produces a "ping" event that clients can use as a heartbeat.
// The emitter exits and closes the returned channel when the given context
// is cancelled.
func getEvents(ts chan string, ctx context.Context) chan Event {
	ret := make(chan Event)
	ticker := time.NewTicker(5 * time.Second)
	go func() {
		defer close(ret)
		defer ticker.Stop()
		ret <- Event{Type: EventTypePing}
		for {
			select {
			case <-ticker.C:
				ret <- Event{Type: EventTypePing}
			case t := <-ts:
				if t == "" {
					return
				}
				ret <- Event{Type: EventTypeMPD, Data: t}
			case <-ctx.Done():
				return
			}
		}
	}()
	return ret
}
