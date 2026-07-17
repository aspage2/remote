package art

import (
	"bufio"
	"encoding/binary"
	"errors"
	"io"
	"strings"
)

var (
	ErrNoAPIC       = errors.New("ID3 section has no APIC")
	ErrMalformedID3 = errors.New("ID3 section malformed")
)

// Parser uses a hybrid buffer + seeker to efficiently
// traverse a file with minimal memory overhead.
type Parser struct {
	rs io.ReadSeeker
	rd *bufio.Reader
	// The position of the read head, regardless of
	// whether or not data is buffered
	pos int
}

func NewParser(rs io.ReadSeeker) *Parser {
	return &Parser{
		rs:  rs,
		rd:  bufio.NewReader(rs),
		pos: 0,
	}
}

func (p *Parser) Take(buf []byte) error {
	if n, err := io.ReadFull(p.rd, buf); err != nil {
		return err
	} else {
		p.pos += n
	}
	return nil
}

// Drop skips the given number of bytes.
func (p *Parser) Drop(n int) error {
	if n <= p.rd.Buffered() {
		_, _ = p.rd.Discard(n)
		p.pos += n
		return nil
	}

	if _, err := p.rs.Seek(int64(p.pos+n), io.SeekStart); err != nil {
		return err
	}
	p.pos += n
	p.rd.Reset(p.rs)
	return nil
}

func (p *Parser) TakeOne() (byte, error) {
	c, err := p.rd.ReadByte()
	if errors.Is(err, io.EOF) {
		return 0, io.ErrUnexpectedEOF
	} else if err != nil {
		return 0, err
	}
	p.pos += 1
	return c, nil
}

func (p *Parser) TakeSentinel(c byte) ([]byte, error) {
	r, err := p.rd.ReadBytes(c)
	if errors.Is(err, io.EOF) {
		return nil, io.ErrUnexpectedEOF
	} else if err != nil {
		return nil, err
	}
	p.pos += len(r)
	return r, nil
}

// After Escape is called, the original ReadSeeker is ensured
// to be set to the position of the next unread byte. It is
// unsafe to use the Parser after calling Escape.
func (p *Parser) Escape() error {
	if p.rd.Buffered() > 0 {
		_, err := p.rs.Seek(int64(p.pos), io.SeekStart)
		return err
	}
	return nil
}

type Header struct {
	Major uint8
	Minor uint8
	Flags uint8
	Size  uint32
}

// Parse the ID3 header from the file.
// ID3 headers look like this:
// {0x49 0x44 0x33 aa bb cc dd dd dd dd}
// Where:
//
//	aa is the major version
//	bb is the minor version
//	cc contains flags
//	the 4 dd makes up the size of the id3 header
func ReadID3Header(parser *Parser) (hdr Header, err error) {
	var buf [10]byte
	if err = parser.Take(buf[:]); err != nil {
		return
	}
	if buf[0] != 'I' || buf[1] != 'D' || buf[2] != '3' {
		err = ErrMalformedID3
		return
	}
	hdr.Major = buf[3]
	hdr.Minor = buf[4]
	hdr.Flags = buf[5]
	var size uint32
	for _, b := range buf[6:] {
		if b&0x80 != 0 {
			err = ErrMalformedID3
			return
		}
		size = (size << 7) | uint32(b)
	}
	hdr.Size = size
	return
}

type V2Header struct {
	Type [3]byte
	Size uint32
}

func ReadV2Frame(parser *Parser) (hdr V2Header, err error) {
	var data [6]byte
	if err = parser.Take(data[:]); err != nil {
		return
	}
	hdr.Size = binary.BigEndian.Uint32(data[2:]) & 0xfff
	copy(hdr.Type[:], data[:])
	return
}

type V3Header struct {
	Type  [4]byte
	Flags uint16
	Size  uint32
}

func TakeV3FrameHeader(parser *Parser) (hdr V3Header, err error) {
	var frameHeader [10]byte
	if err = parser.Take(frameHeader[:]); err != nil {
		return
	}
	hdr.Size = binary.BigEndian.Uint32(frameHeader[4:8])
	hdr.Flags = binary.BigEndian.Uint16(frameHeader[8:])
	copy(hdr.Type[:], frameHeader[:4])
	return
}

// ParseApicFrame pulls the MIMEtype of the apic image and
// places the read head of the parser at the start of the image.
func ParseApicFrame(parser *Parser) (string, error) {
	enc, err := parser.TakeOne()
	if err != nil {
		return "", err
	}
	mimeBytes, err := parser.TakeSentinel('\x00')
	if err != nil {
		return "", err
	}
	err = parser.Drop(1)
	if err != nil {
		return "", err
	}
	if enc != 0 {
		// Skip through the utf-16 encoding
		var buf [2]byte
		for {
			err := parser.Take(buf[:])
			if err != nil {
				return "", err
			}
			if buf[0] == 0 && buf[1] == 0 {
				break
			}
		}
	} else {
		_, err = parser.TakeSentinel('\x00')
		if err != nil {
			return "", err
		}
	}
	return strings.TrimRight(string(mimeBytes), "\x00"), nil
}
