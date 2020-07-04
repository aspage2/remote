FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0
WORKDIR /code

COPY Pipfile Pipfile.lock /code/
RUN apk add --no-cache --virtual .build-deps build-base && \
	pip install pipenv && \
	pipenv install --deploy --system && \
	pip uninstall pipenv -y && \
	apk del .build-deps

COPY src /code/
COPY docker_entrypoint.sh /code/

CMD ["/code/docker_entrypoint.sh"]

