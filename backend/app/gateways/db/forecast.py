from datetime import date
from typing import Sequence, Tuple

from sqlalchemy import func
from sqlmodel import Session, asc, col, false, select

from db.models import Estimate, EstimateItem


class ForecastGW:
    def __init__(self, session: Session):
        self.session = session

    def get_monthly_metrics(
        self, start_date: date, end_date: date
    ) -> Sequence[Tuple[str, int, int]]:
        """
        指定期間の見積もりを月別に集計し、[年月, 合計金額, 件数] を取得
        金額は estimate_items の (price * quantity) の合計
        明細が未登録の見積もりも件数に含めるため外部結合を使用
        """
        year_month = func.to_char(Estimate.issue_date, "YYYY-MM")

        query = (
            select(
                year_month,
                func.coalesce(func.sum(EstimateItem.price * EstimateItem.quantity), 0),
                func.count(func.distinct(col(Estimate.id))),
            )
            .outerjoin(EstimateItem, EstimateItem.estimate_id == Estimate.id)  # type: ignore[arg-type]
            .where(
                Estimate.is_deleted == false(),
                Estimate.issue_date >= start_date,
                Estimate.issue_date <= end_date,
            )
            .group_by(year_month)
            .order_by(asc(year_month))
        )
        return self.session.exec(query).all()
