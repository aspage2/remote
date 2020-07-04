FROM python:3.7-alpine

WORKDIR /code

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0

EXPOSE 80
ENTRYPOINT ["/docker_entrypoint.sh"]

COPY Pipfile.lock Pipfile /code/
RUN apk add --no-cache --virtual build-deps build-base; \
    apk add --no-cache zlib-dev jpeg-dev; \
    pip install pipenv; \
    pipenv install --deploy --system; \
    pip uninstall --yes pipenv; \
    apk del build-deps; \
    rm -f build-deps

COPY remote_art /code/remote_art/
COPY docker_entrypoint.sh /docker_entrypoint.sh


