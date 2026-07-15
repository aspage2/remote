package art

import (
	"bytes"
	"io"
	"os"
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
	data := []byte("\x00image/jpeg\x00\x03this is the description\x00PICTURE DATA")
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
	data := []byte("\x01image/jpeg\x00\x03this is the description\x00\x00PICTURE DATA")
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

func BenchmarkFindAPICInMP3(b *testing.B) {
	f, err := os.Open("../testdata/file.mp3")
	if err != nil {
		panic(err)
	}
	nul, err := os.Open("/dev/null")
	defer f.Close()
	for range b.N {
		_, err := f.Seek(0, io.SeekStart)
		if err != nil {
			panic(err)
		}
		_, sz, err := FindAPICInMP3(f)
		if err != nil {
			panic(err)
		}
		io.CopyN(nul, f, int64(sz))
	}
}
