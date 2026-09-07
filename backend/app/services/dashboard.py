from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import Depends
from sqlmodel import Session

from app.gateways.db.dashboard import DashboardGW
from app.schemas.dashboard import (
    DashboardGraphResponse,
    DashboardSummaryResponse,
    GraphItem,
)
from db.session import get_session


@dataclass
class MonthlyMetric:
    count: int = 0
    amount: int = 0


class DashboardService:
    def __init__(self, session: Session):
        self.dashboard_gw = DashboardGW(session)

    def get_summary(self) -> DashboardSummaryResponse:
        total_count, total_amount = self.dashboard_gw.get_overall_metrics()

        average_amount = 0
        if total_count > 0:
            average_amount = total_amount // total_count

        today = date.today()
        start_of_month = today.replace(day=1)

        current_month_count = self.dashboard_gw.get_count_by_date_range(
            start_date=start_of_month, end_date=today
        )

        return DashboardSummaryResponse(
            total_count=total_count,
            current_month_count=current_month_count,
            total_amount=total_amount,
            average_amount=average_amount,
        )

    def get_graph_items(self, start_date: date, end_date: date) -> DashboardGraphResponse:
        estimates = self.dashboard_gw.get_estimates_with_items_in_range(start_date, end_date)

        monthly_data: defaultdict[str, MonthlyMetric] = defaultdict(MonthlyMetric)

        for est in estimates:
            month_key = est.issue_date.strftime("%Y-%m")

            est_amount = sum(item.subtotal for item in est.items)
            monthly_data[month_key].count += 1
            monthly_data[month_key].amount += est_amount

        graph_items: list[GraphItem] = []
        curr = start_date.replace(day=1)

        # end_dateの月までループ
        while curr <= end_date:
            month_key = curr.strftime("%Y-%m")
            graph_items.append(
                GraphItem(
                    month=month_key,
                    count=monthly_data[month_key].count,
                    amount=monthly_data[month_key].amount,
                )
            )

            curr += relativedelta(months=1)

        return DashboardGraphResponse(graph_items=graph_items)


def get_dashboard_service(session: Session = Depends(get_session)) -> DashboardService:
    return DashboardService(session)
