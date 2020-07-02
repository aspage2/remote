#!/usr/bin/env sh

set -e

cd /code

gunicorn --worker-class=eventlet -w 1 --bind=0.0.0.0:80 --access-logfile - --chdir=/code remote:app --reload

