package gpio

import (
	"os"

	"github.com/go-yaml/yaml"
)


type PinConfig struct {
	Id PinId `yaml:"id"`
	Pin int `yaml:"pin"`
	Desc string `yaml:"name"`
	HighState *PhysicalState `yaml:"high_state"`
}

type GPIOConfig struct {
	PinMode string `yaml:"mode"`
	Amp PinConfig `yaml:"amp"`
	Channels []PinConfig `yaml:"channels"`
	HighState *PhysicalState `yaml:"highState"`
	MaxActiveChannels *int `yaml:"maxActiveChannels"`
}

type Pin struct {
	Name PinId `json:"name"`
	Desc string `json:"desc"`
}

func ConfigFromYaml(fname string) (*PinState, []Pin, error) {
	f, err := os.Open(fname)
	if err != nil {
		return nil, nil, err
	}
	var cfg GPIOConfig
	err = yaml.NewDecoder(f).Decode(&cfg)
	if err != nil {
		return nil, nil, err
	}
	globalDefaultHighState := PhysicalState(true)
	if cfg.HighState != nil {
		globalDefaultHighState = *cfg.HighState
	}

	pins := make([]Pin, len(cfg.Channels))

	var pinState PinState
	pinState.backend = &NopBackend{}
	pinState.amp.isActive = false
	pinState.amp.pin = cfg.Amp.Pin
	pinState.amp.activeState = globalDefaultHighState
	if cfg.Amp.HighState != nil {
		pinState.amp.activeState = *cfg.Amp.HighState
	}
	pinState.maxActive = 1
	if cfg.MaxActiveChannels != nil {
		pinState.maxActive = *cfg.MaxActiveChannels
	}
	pinState.pins = make(map[PinId]*pin)
	for i, c := range cfg.Channels {
		p := &pin{
			pin: c.Pin,
			isActive: false,
		}
		p.activeState = globalDefaultHighState
		if c.HighState != nil {
			p.activeState = *c.HighState
		}
		pinState.pins[c.Id] = p

		pins[i].Desc = c.Desc
		pins[i].Name = c.Id
	}
	return &pinState, pins, nil
}

