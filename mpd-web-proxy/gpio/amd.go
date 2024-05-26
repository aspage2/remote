//go:build amd64

package gpio

import "fmt"

func InitGPIO(pins []int) (GPIOBackend, error) {
	fmt.Printf("Init called with these pins: %v\n", pins)
	return &NopBackend{}, nil
}
