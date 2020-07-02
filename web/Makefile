
PIPENV= pipenv
VENV_WORKDIR= .venv
VIRTUALENV= $(VENV_WORKDIR)/bin/activate

$(VIRTUALENV):
	PIPENV_VENV_IN_PROJECT=1 $(PIPENV) install --dev --deploy

env: $(VIRTUALENV)
.PHONY: env

build: env
	docker build -t remote-web:latest -f docker/Dockerfile .
.PHONY: build

test: env test-unit
.PHONY: test

test-unit: env
	$(PIPENV) run pytest tests/unit -v 
.PHONY: test-unit

fmt: env
	$(PIPENV) run isort -rc --apply tests/ remote/
	$(PIPENV) run black tests/ remote/
.PHONY: fmt

lint: env
	$(PIPENV) run flake8 remote/ tests/
.PHONY: lint

clean:
	$(PIPENV) --rm || exit 0
	rm -rf reports/
	rm -rf __pycache__/
	rm -rf .pytest_cache/
	rm -rf dist/
.PHONY: clean
