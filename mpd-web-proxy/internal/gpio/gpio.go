package gpio

import (
	"log/slog"
)

// PhysicalState represents the physical voltage value
// of a GPIO pin
type PhysicalState bool

const (
	HIGH PhysicalState = true
	LOW  PhysicalState = false
)

// LogicalState represents the "activeness" of a system,
// i.e. whether an observer would consider it "on". There
// is a separation between physical state and logical state
// of a channel because some electronic configurations will
// activate the speaker by setting the voltage on the pin to
// LOW.
type LogicalState bool

// A GPIOBackend strategy is responsible for perforing the
// actual on/off operations of the board.
type GPIOBackend interface {
	Set(int, PhysicalState) error
	Close() error
}

type NopBackend struct{}

func (n *NopBackend) Set(pin int, state PhysicalState) error {
	newState := "LOW"
	if state {
		newState = "HIGH"
	}
	slog.Info("set gpio pin state", slog.Int("pin", pin), slog.String("state", newState))
	return nil
}

func (n *NopBackend) Close() error {
	slog.Info("gpio close called")
	return nil
}
