package art

import (
	"io"
	"os"
	"path"
	"slices"
)

func FindFolderImage(dir string) (string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if e.Name() == "Folder.jpg" || e.Name() == "cover.jpg" {
			return path.Join(dir, e.Name()), nil
		}
	}
	return "", nil
}

func findAPICV2(parser *Parser, header Header) (string, error) {
	endPos := parser.pos + int(header.Size)
	for parser.pos < endPos {
		frame, err := ReadV2Frame(parser)
		if err != nil {
			return "", err
		}
		if slices.Equal(frame.Type[:], []byte("PIC")) {
			return "", nil
		}
	}
	return "", ErrNoAPIC
}

func findAPICV3(parser *Parser, header Header) (string, error) {
	endPos := parser.pos + int(header.Size)
	for parser.pos < endPos {
		frame, err := TakeV3FrameHeader(parser)
		if err != nil {
			return "", err
		}
		if slices.Equal(frame.Type[:], []byte("APIC")) {
			return ParseApicFrame(parser)
		} else if frame.Type[0] == 0 && frame.Type[1] == 0 && frame.Type[2] == 0 && frame.Type[3] == 0 {
			return "", ErrNoAPIC
		} else {
			parser.Drop(int(frame.Size))
		}
	}
	return "", ErrNoAPIC
}

func FindAPICInMP3(rs io.ReadSeeker) (string, uint32, error) {
	parser := NewParser(rs)
	header, err := ReadID3Header(parser)
	if err != nil {
		return "", 0, err
	}
	var mime string
	if header.Major == 2 {
		mime, err = findAPICV2(parser, header)
		if err != nil {
			return "", 0, err
		}
	} else {
		mime, err = findAPICV3(parser, header)
		if err != nil {
			return "", 0, err
		}
	}
	if err := parser.Escape(); err != nil {
		return "", 0, err
	}
	return mime, header.Size, nil
}
