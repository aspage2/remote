package art

import (
	"bufio"
	"os"
	"path"
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

func findAPICV2(rd *bufio.Reader, header *ID3Header) (string, []byte, error) {
	bytesRead := 0
	var frame V2Frame
	for bytesRead < int(header.Size) {
		err := ReadV2Frame(rd, &frame)
		if err != nil {
			return "", nil, err
		}
		bytesRead += 10 + len(frame.Data)
		if frame.Type == "PIC" {
			return "", frame.Data, nil
		}
	}
	return "", nil, ErrNoAPIC
}

func findAPICV3(rd *bufio.Reader, header *ID3Header) (string, []byte, error) {
	bytesRead := 0
	var frame V3Frame
	for bytesRead < int(header.Size) {
		err := ReadV3Frame(rd, &frame)
		if err != nil {
			return "", nil, err
		}
		bytesRead += 10 + len(frame.Data)
		if frame.Type == "APIC" {
			return ApicFrame(frame.Data)
		}
	}
	return "", nil, ErrNoAPIC
}

func FindAPICInMP3(fname string) (string, []byte, error) {
	fh, err := os.Open(fname)
	if err != nil {
		return "", nil, err
	}
	rd := bufio.NewReader(fh)
	header, err := ReadID3Header(rd)
	if err != nil {
		return "", nil, err
	}
	if header.Major == 2 {
		return findAPICV2(rd, header)
	}
	return findAPICV3(rd, header)
}
