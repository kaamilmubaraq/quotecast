from datetime import date, timedelta

from fastapi import Depends
from sqlmodel import Session

from app.gateways.db.analytics import AnalyticsGW
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ExpiringEstimateItem,
    StatusBreakdownItem,
    TopCustomerItem,
)
from db.models import EstimateStatus
from db.session import get_session

# 進行中（まだ結果が出ていない）とみなすステータス
IN_FLIGHT_STATUSES = (EstimateStatus.DRAFT, EstimateStatus.SENT)


class AnalyticsService:
    def __init__(self, session: Session):
        self.analytics_gw = AnalyticsGW(session)

    def get_summary(
        self, expiring_within_days: int = 14, top_customer_limit: int = 5
    ) -> AnalyticsSummaryResponse:
        breakdown = self.analytics_gw.get_status_breakdown()
        by_status = {status: (count, amount) for status, count, amount in breakdown}

        accepted_count, won_amount = by_status.get(EstimateStatus.ACCEPTED, (0, 0))
        rejected_count, _ = by_status.get(EstimateStatus.REJECTED, (0, 0))

        # 受注率は決着した見積もりの中での割合。未決着のものは母数に入れない
        decided_count = accepted_count + rejected_count
        win_rate = accepted_count / decided_count if decided_count else None

        pipeline_count = sum(by_status.get(status, (0, 0))[0] for status in IN_FLIGHT_STATUSES)
        pipeline_amount = sum(by_status.get(status, (0, 0))[1] for status in IN_FLIGHT_STATUSES)
        average_deal_size = won_amount // accepted_count if accepted_count else 0

        today = date.today()
        expiring = self.analytics_gw.get_expiring_soon(
            today, today + timedelta(days=expiring_within_days)
        )

        return AnalyticsSummaryResponse(
            status_breakdown=[
                StatusBreakdownItem(status=status, count=count, amount=amount)
                for status, count, amount in breakdown
            ],
            win_rate=win_rate,
            pipeline_amount=pipeline_amount,
            pipeline_count=pipeline_count,
            won_amount=won_amount,
            average_deal_size=average_deal_size,
            top_customers=[
                TopCustomerItem(customer_name=name, count=count, amount=amount)
                for name, count, amount in self.analytics_gw.get_top_customers(top_customer_limit)
            ],
            expiring_soon=[
                ExpiringEstimateItem(
                    id=estimate.id,
                    estimate_number=estimate.estimate_number,
                    project_name=estimate.project_name,
                    customer_name=estimate.customer_name,
                    expiry_date=estimate.expiry_date,
                    days_remaining=(estimate.expiry_date - today).days,
                    amount=amount,
                )
                for estimate, amount in expiring
            ],
        )


def get_analytics_service(session: Session = Depends(get_session)) -> AnalyticsService:
    return AnalyticsService(session)
