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

func startChannelListener(mpd net.Conn) chan string {
	eventC := make(chan string)
	go func() {
		slog.Debug("start channel listener")
		defer slog.Debug("end channel listener")
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

type Event struct {
	Type EventType
	Data string
}

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
