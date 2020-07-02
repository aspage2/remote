FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0
WORKDIR /code

COPY requirements.txt /code/requirements.txt
RUN apk add --no-cache --virtual .build-deps build-base && \
	pip install -r /code/requirements.txt && \
	apk del .build-deps

COPY src /code/
COPY docker_entrypoint.sh /code/

CMD ["/code/docker_entrypoint.sh"]

