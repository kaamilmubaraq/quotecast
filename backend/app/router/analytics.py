from fastapi import APIRouter, Depends, Query

from app.exceptions.exception import Exception500, ExceptionBase
from app.exceptions.generate import generate_error_responses
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics import AnalyticsService, get_analytics_service

analytics_router = APIRouter()


@analytics_router.get(
    "/summary",
    summary="営業分析サマリー取得",
    response_model=AnalyticsSummaryResponse,
    responses=generate_error_responses([400, 422, 500]),
)
async def get_analytics_summary(
    expiring_within_days: int = Query(14, ge=1, le=90, description="期限切れ警告の日数"),
    top_customer_limit: int = Query(5, ge=1, le=20, description="上位顧客の件数"),
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsSummaryResponse:
    try:
        return service.get_summary(expiring_within_days, top_customer_limit)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)
