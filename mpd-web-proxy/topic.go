package main

import (
	"log/slog"
	"sync"
)

type Topic[T any] struct {
	mu          *sync.Mutex
	subscribers map[chan<- T]struct{}
}

func NewTopic[T any]() *Topic[T] {
	return &Topic[T]{
		mu:          new(sync.Mutex),
		subscribers: make(map[chan<- T]struct{}),
	}
}

func (t *Topic[T]) Subscribe() chan T {
	t.mu.Lock()
	defer t.mu.Unlock()
	myChan := make(chan T)
	t.subscribers[myChan] = struct{}{}
	slog.Debug("client subscribed", "chan", myChan)
	return myChan
}

func (t *Topic[T]) Unsubscribe(myChan chan<- T) {
	t.mu.Lock()
	defer t.mu.Unlock()
	slog.Debug("client unsubscribed", "chan", myChan)
	delete(t.subscribers, myChan)
	close(myChan)
}

func (t *Topic[T]) Publish(ev T) {
	t.mu.Lock()
	defer t.mu.Unlock()
	slog.Debug("publish event", "event", ev, "to", t.subscribers)
	for c := range t.subscribers {
		c <- ev
	}
}
