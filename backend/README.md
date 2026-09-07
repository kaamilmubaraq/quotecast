# QuoteCast backend

FastAPI application serving the quotation API and the demand forecasting endpoint.
See the [project README](../README.md) for the full overview and setup instructions.

## Layout

| Path | Responsibility |
| --- | --- |
| `algorithm/` | Forecasting library — models, cross-validation, prediction intervals. No DB or framework dependencies. |
| `app/router/` | FastAPI routes, query validation, error responses |
| `app/services/` | Business logic |
| `app/gateways/db/` | Data access |
| `app/schemas/` | Request and response models |
| `db/` | SQLModel table definitions and session management |
| `scripts/` | Forecast benchmark tooling |

## Commands

All commands run inside the container, because `compose.yaml` bind-mounts `./backend` to `/app`
and `.venv` belongs to the container.

```bash
docker compose exec backend uv run pytest tests -q      # tests
docker compose exec backend uv run ruff check .         # lint
docker compose exec backend uv run ruff format .        # format
docker compose exec backend uv run mypy .               # type check

# forecast accuracy benchmark
docker compose exec backend uv run python scripts/benchmark_forecast.py
```

Database migrations and the OpenAPI schema are driven from the repository root:

```bash
make migrate   # apply migrations
make gen       # regenerate openapi.json and the frontend API client
```
