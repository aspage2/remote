FROM golang:1.22

EXPOSE 8000

WORKDIR /app

COPY *.go ./
COPY go.mod go.sum ./

RUN go build -o /app/main

ENTRYPOINT ["/app/main"]
