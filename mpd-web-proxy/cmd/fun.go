package main

import (
	"bytes"
	"fmt"
	"io"
	"os"

	"github.com/aspage2/remote/mpd-web-proxy/art"
)

func Must[T any](t T, err error) T {
	if err != nil {
		panic(err)
	}
	return t
}

func main() {
	mime, data, err := art.FindAPICInMP3(os.Args[1])
	if err != nil {
		panic(err)
	}
	fmt.Println(mime)
	fmt.Printf("%d bytes\n", len(data))

	fptr, err := os.Create("out.jpg")
	if err != nil {
		panic(err)
	}
	defer fptr.Close()
	io.Copy(fptr, bytes.NewReader(data))
}
