from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.exceptions.exception import Exception500, ExceptionBase
from app.exceptions.generate import generate_error_responses
from app.schemas.dashboard import DashboardGraphResponse, DashboardSummaryResponse
from app.services.dashboard import DashboardService, get_dashboard_service

dashboard_router = APIRouter()


@dashboard_router.get(
    "/summary",
    summary="ダッシュボード集計取得",
    response_model=DashboardSummaryResponse,
    responses=generate_error_responses([500]),
)
async def get_dashboard_summary(
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardSummaryResponse:
    try:
        return service.get_summary()
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)


@dashboard_router.get(
    "/trends",
    summary="見積もり推移（月別）取得",
    response_model=DashboardGraphResponse,
    responses=generate_error_responses([400, 422, 500]),
)
async def get_dashboard_trends(
    start_date: Optional[date] = Query(None, description="開始日 (未指定の場合は6ヶ月前)"),
    end_date: Optional[date] = Query(None, description="終了日 (未指定の場合は今日)"),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardGraphResponse:
    try:
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=180)  # 6ヶ月

        return service.get_graph_items(start_date, end_date)
    except ExceptionBase as e:
        raise e
    except Exception as e:
        raise Exception500(e)
