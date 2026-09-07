from datetime import date
from typing import Sequence, Tuple

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, asc, col, false, select

from db.models import Estimate, EstimateItem


class DashboardGW:
    def __init__(self, session: Session):
        self.session = session

    def get_overall_metrics(self) -> Tuple[int, int]:
        """
        全期間の [見積もり総件数, 見積もり総額] を取得
        総額は estimate_items の (price * quantity) の合計
        """
        count_query = select(func.count(col(Estimate.id))).where(Estimate.is_deleted == false())
        total_count = self.session.exec(count_query).one() or 0

        amount_query = (
            select(func.sum(EstimateItem.price * EstimateItem.quantity))
            .join(Estimate, EstimateItem.estimate_id == Estimate.id)  # type: ignore[arg-type]
            .where(Estimate.is_deleted == false())
        )
        total_amount = self.session.exec(amount_query).one() or 0

        return total_count, int(total_amount)

    def get_count_by_date_range(self, start_date: date, end_date: date) -> int:
        query = select(func.count(col(Estimate.id))).where(
            Estimate.is_deleted == false(),
            Estimate.issue_date >= start_date,
            Estimate.issue_date <= end_date,
        )
        return self.session.exec(query).one() or 0

    def get_estimates_with_items_in_range(
        self, start_date: date, end_date: date
    ) -> Sequence[Estimate]:
        query = (
            select(Estimate)
            .where(
                Estimate.is_deleted == false(),
                Estimate.issue_date >= start_date,
                Estimate.issue_date <= end_date,
            )
            .options(selectinload(Estimate.items))  # type: ignore[arg-type]
            .order_by(asc(Estimate.issue_date))
        )
        return self.session.exec(query).all()
