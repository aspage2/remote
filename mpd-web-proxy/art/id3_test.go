package art

import (
	"bytes"
	"io"
	"os"
	"testing"
)

func BenchmarkFindAPICInMP3(b *testing.B) {
	f, err := os.Open("/dev/null")
	if err != nil {
		panic(err)
	}
	defer f.Close()
	for range b.N {
		_, buf, err := FindAPICInMP3("../testdata/file.mp3")
		if err != nil {
			panic(err)
		}
		io.Copy(f, bytes.NewReader(buf))
	}
}
