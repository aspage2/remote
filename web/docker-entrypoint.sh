#!/usr/bin/env sh

set -e
cd /code
exec uvicorn --host=0.0.0.0 --port=80 remote:app --reload

