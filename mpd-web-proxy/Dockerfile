FROM golang:1.22

EXPOSE 8000

WORKDIR /app

COPY go.mod go.sum ./
COPY *.go ./
COPY gpio/ ./gpio/
COPY art/ ./art/

RUN go build -o /app/main

ENTRYPOINT ["/app/main"]
