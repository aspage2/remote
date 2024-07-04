package art

import (
	"bufio"
	"encoding/binary"
	"errors"
	"io"
)

var (
	ErrNoAPIC       = errors.New("ID3 section has no APIC")
	ErrMalformedID3 = errors.New("ID3 section malformed")
)

type ID3Header struct {
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
func ReadID3Header(rd *bufio.Reader) (*ID3Header, error) {
	var ret ID3Header
	hdr := make([]byte, 10)
	if _, err := io.ReadFull(rd, hdr); err != nil {
		return nil, err
	}
	if hdr[0] != 'I' || hdr[1] != 'D' || hdr[2] != '3' {
		return nil, ErrMalformedID3
	}
	ret.Major = hdr[3]
	ret.Minor = hdr[4]
	var size uint32
	for _, b := range hdr[4:] {
		if b&0x80 != 0 {
			return nil, ErrMalformedID3
		}
		size = (size << 7) | uint32(b)
	}
	ret.Size = size
	return &ret, nil
}

type V2Frame struct {
	Type string
	Data []byte
}

func ReadV2Frame(rd *bufio.Reader, fr *V2Frame) error {
	data := make([]byte, 6)
	if _, err := io.ReadFull(rd, data); err != nil {
		return err
	}
	frameType := string(data[:3])
	frameSize := (uint32(data[3]) << 16) | (uint32(data[4]) << 8) | uint32(data[5])
	ret := make([]byte, frameSize)
	if _, err := io.ReadFull(rd, ret); err != nil {
		return err
	}
	fr.Type = frameType
	fr.Data = ret
	return nil
}

func PicFrame(data []byte) (string, []byte, error) {
	return "", nil, nil
}

type V3Frame struct {
	Type  string
	Flags uint16
	Data  []byte
}

func ReadV3Frame(rd *bufio.Reader, fr *V3Frame) error {
	frameHeader := make([]byte, 10)
	if _, err := io.ReadFull(rd, frameHeader); err != nil {
		return err
	}
	frameType := string(frameHeader[:4])
	frameSize := binary.BigEndian.Uint32(frameHeader[4:8])
	frameFlags := (uint16(frameHeader[8]) << 8) | uint16(frameHeader[9])
	frameData := make([]byte, frameSize)

	if _, err := io.ReadFull(rd, frameData); err != nil {
		return err
	}
	fr.Type = frameType
	fr.Data = frameData
	fr.Flags = frameFlags
	return nil
}

func ApicFrame(data []byte) (string, []byte, error) {
	ptr := 1
	for ; ptr < len(data) && data[ptr] != 0; ptr++ {}
	if ptr == len(data) {
		return "", nil, ErrMalformedID3
	}
	mimeType := string(data[1:ptr])
	ptr += 2
	for ; ptr < len(data) && data[ptr] != 0; ptr++ {}
	return mimeType, data[ptr+1:], nil
}

