package main

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"strings"
)

func MpdQuery(cmd string) ([]byte, error) {
	mpd, err := net.Dial("tcp", MpdAuthority)
	if err != nil {
		return nil, err
	}
	defer mpd.Close()
	return mpdQuery(cmd, mpd)
}

func MpdQueryContext(cmd string, ctx context.Context) ([]byte, error) {
	mpd, err := net.Dial("tcp", MpdAuthority)
	if err != nil {
		return nil, err
	}
	go func() {
		<-ctx.Done()
		fmt.Println("client gone. closing mpd")
		mpd.Close()
	}()
	return mpdQuery(cmd, mpd)
}

func mpdQuery(cmd string, mpd io.ReadWriter) ([]byte, error) {
	scanner := bufio.NewScanner(mpd)
	if !scanner.Scan() {
		if err := scanner.Err(); err != nil {
			return nil, err
		}
		return nil, errors.New("unexpected EOF")
	}
	if _, err := io.WriteString(mpd, strings.TrimSpace(cmd)+"\n"); err != nil {
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
