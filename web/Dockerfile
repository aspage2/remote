FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0

WORKDIR /code

ENTRYPOINT ["/code/docker-entrypoint.sh"]

COPY Pipfile Pipfile.lock /code/
RUN apk add --virtual build-deps build-base; \
    pip install pipenv; \
    pipenv install --system --deploy; \
    pip uninstall pipenv -y; \
    apk del build-deps

COPY remote /code/remote/
COPY docker-entrypoint.sh /code/

