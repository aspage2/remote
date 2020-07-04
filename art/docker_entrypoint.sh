#!/usr/bin/env sh

set -e

cd /code

gunicorn remote_art:app --bind=0.0.0.0:80

