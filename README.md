# QuoteCast

**A quotation management app with a demand forecasting engine built from scratch.**

Create, track and export sales quotations — and forecast how many will come in next quarter,
using a statistical forecasting engine implemented directly on NumPy (no Prophet, no statsmodels).

[![CI](https://github.com/kaamilmubaraq/quotecast/actions/workflows/ci.yml/badge.svg)](https://github.com/kaamilmubaraq/quotecast/actions/workflows/ci.yml)

[日本語版 README →](./README.ja.md)

---

## Overview

QuoteCast is a full-stack quotation (見積もり) management system for a sales team:

| Area | What it does |
| --- | --- |
| **Quotations** | Create, edit and delete quotations with line items, categories and drag-to-reorder groups |
| **PDF** | Renders a print-ready quotation PDF in the browser, with live preview |
| **Dashboard** | Monthly revenue/volume trends, summary cards, period selector |
| **Forecasting** | Projects future quotation volume and value, with 95% prediction intervals |
| **Filtering** | Filter the quotation list by status, issue date and expiry date |

The part worth reading the code for is the forecasting engine.

---

## The forecasting engine

Most "forecast" features in business apps are a moving average with a trend line bolted on.
This one is a small, honest forecasting library, written to be defensible rather than impressive.

### How it works

**1. A pool of candidate models**, each implemented from its state-space definition:

| Model | Behaviour | Why it's in the pool |
| --- | --- | --- |
| Simple exponential smoothing — ETS(A,N,N) | Flat forecast that tracks the level | Most robust option when a series is noisy and trendless |
| Damped trend — ETS(A,A<sub>d</sub>,N) | Extrapolates a trend, damped by φ | Strong M4 competition performer; long horizons converge instead of diverging |
| Theta method | Averages a regression line with an SES-smoothed level | Won the M3 competition; best method for monthly data in M4 |
| Naive (random walk) | Repeats the last observation | Adapts instantly to a step change; the standard benchmark |
| Combination | Equal-weight mean of the first three | The M2-winning "COMB S-H-D" idea — averaging beats picking, when you can't tell which model is right |

**2. Smoothing parameters are estimated, not hardcoded.** α, β and φ are found by minimising the
sum of squared one-step errors over a deterministic grid, so there is no `alpha = 0.4` magic number.

**3. The model is chosen per series by backtesting.** Rolling-origin cross-validation walks the
forecast origin forward one month at a time, trains only on data before that origin, and scores
each candidate by MASE. Whatever actually predicted that series best is what gets used — a series
with a clean trend picks a trend model; a noisy one picks a flat one.

**4. Confidence comes from the residuals.** Prediction intervals use each model's forecast variance
formula (e.g. σ²ₕ = σ²[1 + α²(h−1)] for SES), not a hand-tuned decay curve. The confidence score
shown in the UI is derived from the relative width of the 95% interval, so it falls naturally as the
horizon extends and as a series gets noisier.

**5. The forecast is deterministic.** The same history always produces the same numbers.

### Does it actually work?

Rolling-origin backtest over five demand patterns, scored in MASE (lower is better; 1.000 means
"no better than repeating last month's number"):

| Demand pattern | Naive | Mean | Drift | **QuoteCast** |
| --- | --- | --- | --- | --- |
| Rising trend | 1.169 | 3.608 | 1.029 | **0.925** |
| Falling trend | 1.261 | 4.927 | **1.009** | 1.014 |
| Flat | 0.987 | 0.792 | 1.075 | **0.767** |
| Level shift | **1.385** | 3.645 | 1.533 | 1.594 |
| High volatility | **1.628** | 1.829 | 1.778 | **1.628** |
| **Overall** | 1.286 | 2.960 | 1.285 | **1.185** |

Reproduce it yourself:

```bash
docker compose exec backend uv run python scripts/benchmark_forecast.py
```

**The honest caveat:** QuoteCast loses to the naive benchmark on the *level shift* pattern. A
one-off structural break can't be predicted by any method — the only question is how fast a model
recovers, and smoothing recovers more slowly than simply repeating the last value. Buying faster
step-change response would mean weighting recent months more heavily, which costs accuracy on every
other pattern. The pool includes the naive model precisely so cross-validation *can* pick it when a
series genuinely behaves that way.

### Why there is no seasonality component

Monthly seasonality is the obvious next feature, and it is deliberately absent. Estimating a
12-month seasonal profile needs at least three full cycles (36 months) — the threshold used by the
M4 competition's benchmark implementation. This API exposes at most 24 months of history, which
would mean fitting each monthly index from two observations or fewer. That adds variance, not
signal. The decision is documented in the module docstring so it can be revisited when more history
is available.

### References

- Hyndman & Athanasopoulos (2021), *Forecasting: Principles and Practice*, 3rd ed., ch. 8
- Hyndman & Billah (2003), *Unmasking the Theta method*, International Journal of Forecasting 19(2)
- Assimakopoulos & Nikolopoulos (2000), *The theta model*, International Journal of Forecasting 16(4)

---

## Architecture

```
backend/
├── algorithm/              # Forecasting library — pure functions, no DB, no framework
│   ├── smoothing.py        # The models: SES, damped Holt, Theta, Naive, Combination
│   ├── evaluation.py       # Rolling-origin cross-validation and MASE
│   └── forecast_algorithm.py  # Orchestration: preprocessing, intervals, trend analysis
├── app/
│   ├── router/             # HTTP layer — FastAPI routes, validation, error responses
│   ├── services/           # Business logic
│   ├── gateways/db/        # Data access
│   └── schemas/            # Request/response models
├── db/                     # SQLModel models and session management
└── scripts/                # Benchmark tooling

frontend/
├── app/
│   ├── routes/             # React Router file-based routes
│   ├── components/         # UI, grouped by feature
│   ├── hooks/              # Data fetching and view state
│   └── gen/                # Generated API client — never edited by hand
```

Two boundaries are worth calling out:

**The forecasting library knows nothing about the web app.** It takes a list of monthly figures and
returns predictions. No database, no FastAPI, no I/O — which is what makes it testable to 100%
branch coverage and reusable outside this project.

**The frontend API client is generated, not written.** FastAPI emits an OpenAPI schema, and
[Orval](https://orval.dev/) generates typed React Query hooks from it. A backend response shape
change becomes a frontend compile error rather than a runtime surprise. `app/gen/` is regenerated
with `make gen` and never edited by hand.

---

## Tech stack

**Backend** — Python 3.12, FastAPI, SQLModel, Alembic, PostgreSQL, NumPy, uv, Ruff, mypy, pytest
**Frontend** — TypeScript, React 19, React Router 7, TanStack Query, Tailwind CSS, shadcn/ui, Recharts, Vite
**Infra** — Docker Compose, GitHub Actions

---

## Getting started

**Requirements:** Docker, Node.js 22+, Yarn

```bash
# 1. Start the API and database
docker compose up -d

# 2. Apply migrations and load ~12 months of sample quotations
make migrate
docker compose exec backend uv run python seed_local.py

# 3. Start the frontend
cd frontend
cp .env.local.example .env.local
yarn install && yarn dev
```

The seed script generates a year of realistic quotation history, which is what the dashboard
chart and the forecasting endpoint need in order to show anything interesting.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

---

## Testing and quality

```bash
# Backend: tests, lint, types
docker compose exec backend uv run pytest tests -q
docker compose exec backend uv run ruff check .
docker compose exec backend uv run mypy .

# Forecasting engine coverage — enforced at 100%, branches included
docker compose exec backend uv run coverage run --source=algorithm -m pytest tests -q
docker compose exec backend uv run coverage report

# Frontend
cd frontend && yarn lint && yarn tsc -b
```

Every one of these runs in CI on each push and pull request.

The forecasting tests assert *properties* rather than frozen expected values — that prediction
intervals contain their point forecast, that uncertainty grows with the horizon, that a damped trend
converges to ℓ + b·φ/(1−φ) instead of diverging, that identical input produces identical output.
Tests written against hardcoded numbers would have to be rewritten every time the model improves;
these ones only fail if the forecast stops making sense.

---

## License

MIT
