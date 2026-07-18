package internal

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"net"
	"strings"
)

// MpdQuery connects and queries the MPD server
// with the given command. Returns the response body
// or any connection error.
func MpdQuery(authority string, cmd string, args ...any) ([]byte, error) {
	mpd, err := net.Dial("tcp", authority)
	if err != nil {
		return nil, err
	}
	defer mpd.Close()
	return mpdQuery(mpd, cmd, args...)
}

// mpdQuery reads and parses a response stream
// to verify that the response is valid.
func mpdQuery(mpd io.ReadWriter, cmd string, args ...any) ([]byte, error) {
	q := fmt.Sprintf(cmd, args...)
	scanner := bufio.NewScanner(mpd)
	if !scanner.Scan() {
		if err := scanner.Err(); err != nil {
			return nil, err
		}
		return nil, errors.New("unexpected EOF")
	}
	if _, err := io.WriteString(mpd, strings.TrimSpace(q)+"\n"); err != nil {
		return nil, err
	}
	var ret bytes.Buffer
	for scanner.Scan() {
		data := scanner.Bytes()
		ret.Write(data)
		ret.WriteByte('\n')
		if bytes.HasPrefix(data, []byte{'O', 'K'}) {
			return io.ReadAll(&ret)
		}
		if bytes.HasPrefix(data, []byte{'A', 'C', 'K'}) {
			return io.ReadAll(&ret)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return nil, errors.New("unexpected EOF")
}
