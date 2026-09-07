from fastapi import APIRouter, Depends, Query

from app.exceptions.exception import Exception500, ExceptionBase
from app.exceptions.generate import generate_error_responses
from app.schemas.forecasts import MonthlyForecastResponse
from app.services.forecasts import ForecastService, get_forecast_service

forecast_router = APIRouter()


@forecast_router.get(
    "/monthly",
    summary="月別需要予測取得",
    response_model=MonthlyForecastResponse,
    responses=generate_error_responses([400, 422, 500]),
)
async def get_monthly_forecast(
    months_back: int = Query(6, ge=1, le=24, description="過去何ヶ月分のデータを使うか"),
    months_ahead: int = Query(3, ge=1, le=12, description="何ヶ月先まで予測するか"),
    service: ForecastService = Depends(get_forecast_service),
) -> MonthlyForecastResponse:
    try:
        return service.get_monthly_forecast(months_back, months_ahead)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)
