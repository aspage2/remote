package main

import (
	"fmt"
	"log/slog"
	"net/http"
)

// A StatusCaptureRW wraps response writers to capture
// the status code returned from an HTTP handler.
//
// XXX - this is a barebones handler that does not implement
//       flushing, hijacking or any of the other http interfaces.
type StatusCaptureRW struct {
	http.ResponseWriter
	status int
}

func NewStatusCaptureRW(rw http.ResponseWriter) *StatusCaptureRW {
	return &StatusCaptureRW{ResponseWriter: rw, status: 0}
}

func (lr *StatusCaptureRW) WriteHeader(code int) {
	lr.status = code
	lr.ResponseWriter.WriteHeader(code)
}

func loggingMiddleware(next http.Handler) http.Handler {
	f := func(rw http.ResponseWriter, req *http.Request) {
		sc := NewStatusCaptureRW(rw)
		next.ServeHTTP(sc, req)

		line := fmt.Sprintf("%s %s %d", req.RemoteAddr, req.URL.String(), sc.status) 

		switch sc.status / 100 {
			case 3, 4:
				slog.Warn(line)
			case 5:
				slog.Error(line)
			default:
				slog.Info(line)
		}
	}
	return http.HandlerFunc(f)
}

