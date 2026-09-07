sync:
	uv sync

_ruff_lint:
	uv run ruff check

_ruff_isort:
	uv run ruff check --select I --fix

_ruff_fmt:
	uv run ruff format

_mypy:
	uv run mypy ./

lint:
	make -j _ruff_lint _mypy

fmt:
	make -j _ruff_isort _ruff_fmt 

dev:
	uv run uvicorn app.main:app --reload

ddl:
	uv run alembic revision --autogenerate -m "some new change"; \

migrate:
	uv run alembic upgrade head

.PHONY: test
test:
	DB_USER= \
	DB_PASS=password \
	DB_PORT=54322 \
	DB_HOST=localhost \
	DB_NAME=admin \
	uv run pytest . -vv

gen:
	DB_USER=admin \
	DB_PASS=password \
	DB_PORT=54322 \
	DB_HOST=localhost \
	DB_NAME=admin \
	SCHEMA_GEN_MODE=1 uv run python openapi.py > openapi.json

env-info:
	uv run python -c "import sys; print(sys.prefix)"
