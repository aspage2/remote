FROM debian:buster-slim

RUN apt-get update && apt-get install -y mpd mpc

RUN mkdir -p /var/lib/mpd /run/mpd


EXPOSE 6600
ENTRYPOINT ["mpd", "--stdout", "--no-daemon"]
