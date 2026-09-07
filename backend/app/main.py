from fastapi import FastAPI

from app.router.analytics import analytics_router
from app.router.categories import category_router
from app.router.dashboard import dashboard_router
from app.router.estimates import estimate_router
from app.router.forecasts import forecast_router
from app.router.health import health_router

BASE_PREFIX = "/api"

app = FastAPI()

app.include_router(health_router, tags=["health"])
app.include_router(
    router=category_router,
    prefix=BASE_PREFIX + "/categories",
    tags=["categories"],
)
app.include_router(
    router=estimate_router,
    prefix=BASE_PREFIX + "/estimates",
    tags=["estimates"],
)
app.include_router(
    router=dashboard_router,
    prefix=BASE_PREFIX + "/dashboards",
    tags=["dashboards"],
)
app.include_router(
    router=forecast_router,
    prefix=BASE_PREFIX + "/forecasts",
    tags=["forecasts"],
)
app.include_router(
    router=analytics_router,
    prefix=BASE_PREFIX + "/analytics",
    tags=["analytics"],
)
