FROM python:3.7-slim

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0

WORKDIR /code

ENTRYPOINT ["/code/docker-entrypoint.sh"]

COPY Pipfile Pipfile.lock /code/
RUN apt-get update; \
    apt-get install -y --no-install-recommends gcc; \
    pip install pipenv; \
    pipenv requirements > requirements.txt; \
    #pip uninstall pipenv -y; \
	pip install -r requirements.txt; \
    apt-get purge -y --auto-remove gcc

COPY remote /code/remote/
COPY docker-entrypoint.sh /code/

