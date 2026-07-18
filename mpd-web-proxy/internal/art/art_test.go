package art

import (
	"io"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

const DataPath = "../../testdata/file.mp3"

func TestFindAPIC(t *testing.T) {
	f, err := os.Open(DataPath)
	assert.NoError(t, err)

	mime, size, err := FindAPICInMP3(f)
	assert.NoError(t, err)
	assert.Equal(t, "image/jpeg", mime)
	assert.EqualValues(t, 162267, size)
	off, err := f.Seek(0, io.SeekCurrent)
	assert.NoError(t, err)
	assert.EqualValues(t, 374, off)
}

func BenchmarkFindAPICInMP3(b *testing.B) {
	f, err := os.Open(DataPath)
	if err != nil {
		panic(err)
	}
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
		io.CopyN(io.Discard, f, int64(sz))
	}
}
