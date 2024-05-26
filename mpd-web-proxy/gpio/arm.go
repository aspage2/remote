//go:build arm
package gpio

import (
	"errors"

	"github.com/stianeikeland/go-rpio/v4"
)

type bcm struct {
	isOpen bool
}

func (b *bcm) Close() error {
	err := rpio.Close()
	if err != nil {
		return err
	}
	b.isOpen = false
	return nil
}

func (b *bcm) Set(pin int, state PhysicalState) error {
	if !b.isOpen {
		return errors.New("gpio closed")
	}
	if state {
		rpio.Pin(pin).Write(rpio.High)
	} else {
		rpio.Pin(pin).Write(rpio.Low)
	}
	return nil
}

func openBCM() (*bcm, error) {
	err := rpio.Open()
	if err != nil {
		return nil, err
	}
	return &bcm{isOpen: true}, nil
}

func (b *bcm) initPins(pins []int) {
	for _, pin := range pins {
		rpio.Pin(pin).Mode(rpio.Output)
	}
}

func InitGPIO(pins []int) (GPIOBackend, error) {
	b, err := openBCM()
	if err != nil {
		return nil, err
	}
	b.initPins(pins)
	return b, nil
}
