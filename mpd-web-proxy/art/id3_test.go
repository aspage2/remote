package art

import (
	"bytes"
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParserTake(t *testing.T) {
	p := NewParser(strings.NewReader("hello, world"))

	var data [5]byte
	assert.NoError(t, p.Take(data[:]))

	assert.Equal(t, data[:], []byte("hello"))
}

func TestTakeTooMuch(t *testing.T) {
	p := NewParser(strings.NewReader("hi"))

	var data [10]byte
	assert.ErrorIs(t, p.Take(data[:]), io.ErrUnexpectedEOF)
}

func TestTakeOneIsStillTooMuch(t *testing.T) {
	p := NewParser(strings.NewReader(""))
	_, err := p.TakeOne()
	assert.ErrorIs(t, err, io.ErrUnexpectedEOF)
}

func TestParserDrop(t *testing.T) {
	p := NewParser(strings.NewReader("hello, world"))

	assert.NoError(t, p.Drop(7))

	var data [5]byte
	assert.NoError(t, p.Take(data[:]))
	assert.Equal(t, data[:], []byte("world"))
}

func TestEscape(t *testing.T) {
	r := strings.NewReader("hello, world")
	p := NewParser(r)

	var data [5]byte
	assert.NoError(t, p.Take(data[:]))

	// The readseeker will have been exhausted
	// by parser's internal bufio.Reader buffer.
	// This way, we can assure that Escape() does
	// something.
	_, e := r.ReadByte()
	assert.ErrorIs(t, e, io.EOF)

	assert.NoError(t, p.Escape())
	c, e := r.ReadByte()
	assert.NoError(t, e)
	assert.EqualValues(t, c, ',')
}

func TestParseAPICFrame(t *testing.T) {
	data := []byte("\x00image/jpeg\x00\x03This is description\x00PICTURE DATA")
	rd := bytes.NewReader(data)
	p := NewParser(rd)

	mime, err := ParseApicFrame(p)
	assert.NoError(t, err)
	assert.NoError(t, p.Escape())
	assert.Equal(t, mime, "image/jpeg")

	buf, err := io.ReadAll(rd)
	assert.NoError(t, err)
	assert.Equal(t, string(buf), "PICTURE DATA")
}

func TestParseAPICFrameOtherEnc(t *testing.T) {
	data := []byte("\x01image/jpeg\x00\x03f\x00o\x00o\x00\x00\x00PICTURE DATA")
	rd := bytes.NewReader(data)
	p := NewParser(rd)

	mime, err := ParseApicFrame(p)
	assert.NoError(t, err)
	assert.NoError(t, p.Escape())
	assert.Equal(t, mime, "image/jpeg")

	buf, err := io.ReadAll(rd)
	assert.NoError(t, err)
	assert.Equal(t, string(buf), "PICTURE DATA")
}

func TestReadID3Header(t *testing.T) {
	data := "ID3\x02\x03\x07\x00\x00\x00\x7f"

	p := NewParser(strings.NewReader(data))

	hdr, err := ReadID3Header(p)
	assert.NoError(t, err)

	assert.EqualValues(t, hdr.Flags, 0b00000111)
	assert.EqualValues(t, hdr.Major, 2)
	assert.EqualValues(t, hdr.Minor, 3)
	assert.EqualValues(t, hdr.Size, 127)
}

func TestReadID3HeaderMalformed(t *testing.T) {
	for _, tc := range []struct {
		name string
		data string
	}{
		{name: "bad magic", data: "IDG\x02\x03\x07\x00\x00\x00\x7f"},
		{name: "bad size", data: "ID3\x02\x03\x07\x00\x00\x00\xff"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := NewParser(strings.NewReader(tc.data))
			_, err := ReadID3Header(p)
			assert.ErrorIs(t, err, ErrMalformedID3)
		})
	}
}

func TestTakeV3Header(t *testing.T) {
	d := "APIC\x00\x00\x00\xff\x00\x07"
	p := NewParser(strings.NewReader(d))
	hdr, err := TakeV3FrameHeader(p)
	assert.NoError(t, err)

	assert.EqualValues(t, "APIC", string(hdr.Type[:]))
	assert.EqualValues(t, 255, hdr.Size)
	assert.EqualValues(t, 0b111, hdr.Flags)
}
