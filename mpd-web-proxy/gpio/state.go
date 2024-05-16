package gpio

import "errors"

type PinId string

type pin struct {
	activeState PhysicalState
	isActive LogicalState
	pin int
}

func (p *pin) on(backend GPIOBackend) error {
	p.isActive = true
	return backend.Set(p.pin, p.activeState)
}

func (p *pin) off(backend GPIOBackend) error {
	p.isActive = false
	return backend.Set(p.pin, !p.activeState)
}

type PinState struct {
	pins map[PinId]*pin
	maxActive int
	amp pin
	numActive int
	backend GPIOBackend
}

func (s *PinState) pin(id PinId) (*pin, bool) {
	_, ok := s.pins[id]
	if !ok {
		return nil, false
	}
	return s.pins[id], true
}

func (s *PinState) SystemOff() error {
	s.numActive = 0
	for _, p := range s.pins {
		if err := p.off(s.backend); err != nil {
			return err
		}
	}
	return s.amp.off(s.backend)
}

func (s *PinState) On(id PinId) error {
	p, ok := s.pin(id)
	if !ok {
		return errors.New("no such pin")
	}
	if p.isActive {
		return nil
	}
	if s.numActive >= s.maxActive {
		return errors.New("too many channels")
	}
	if err := p.on(s.backend); err != nil {
		return err
	}
	s.numActive++
	if !s.amp.isActive {
		return s.amp.on(s.backend)
	}
	return nil
}

func (s *PinState) Off(id PinId) error {
	p, ok := s.pin(id)
	if !ok {
		return errors.New("no such pin")
	}
	if !p.isActive {
		return nil
	}
	if err := p.off(s.backend); err != nil {
		return err
	}
	s.numActive--
	if s.numActive == 0 && s.amp.isActive {
		return s.amp.off(s.backend)
	}
	return nil
}

func (s *PinState) Toggle(id PinId) error {
	p, ok := s.pin(id)
	if !ok {
		return errors.New("no such pin")
	}
	if p.isActive {
		return s.Off(id)
	} else {
		return s.On(id)
	}
}

func (s *PinState) ActiveChannels() (vals []PinId) {
	for id, pin := range s.pins {
		if pin.isActive {
			vals = append(vals, id)
		}
	}
	return
}
