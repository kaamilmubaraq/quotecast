from datetime import date
from typing import Sequence, Tuple

from sqlalchemy import func
from sqlmodel import Session, asc, col, desc, false, select

from db.models import Estimate, EstimateItem, EstimateStatus

# 明細を外部結合するため、金額はNULLになりうる。0で畳んでから集計する
_AMOUNT = func.coalesce(func.sum(EstimateItem.price * EstimateItem.quantity), 0)
_ESTIMATE_COUNT = func.count(func.distinct(col(Estimate.id)))


class AnalyticsGW:
    def __init__(self, session: Session):
        self.session = session

    def get_status_breakdown(self) -> Sequence[Tuple[EstimateStatus, int, int]]:
        """ステータスごとの [件数, 金額合計] を返す

        明細との結合で行が増えるため、件数は見積もりIDのdistinctで数える。
        """
        query = (
            select(Estimate.status, _ESTIMATE_COUNT, _AMOUNT)
            .select_from(Estimate)
            .join(EstimateItem, col(EstimateItem.estimate_id) == col(Estimate.id), isouter=True)
            .where(Estimate.is_deleted == false())
            .group_by(col(Estimate.status))
        )
        return [
            (EstimateStatus(row[0]), int(row[1]), int(row[2]))
            for row in self.session.exec(query).all()
        ]

    def get_top_customers(self, limit: int) -> Sequence[Tuple[str, int, int]]:
        """金額の大きい順に顧客を返す"""
        query = (
            select(Estimate.customer_name, _ESTIMATE_COUNT, _AMOUNT)
            .select_from(Estimate)
            .join(EstimateItem, col(EstimateItem.estimate_id) == col(Estimate.id), isouter=True)
            .where(Estimate.is_deleted == false(), col(Estimate.customer_name).is_not(None))
            .group_by(col(Estimate.customer_name))
            .order_by(desc(_AMOUNT))
            .limit(limit)
        )
        return [(str(row[0]), int(row[1]), int(row[2])) for row in self.session.exec(query).all()]

    def get_expiring_soon(self, today: date, until: date) -> Sequence[Tuple[Estimate, int]]:
        """期限が近い（まだ確定していない）見積もりを期限が早い順に返す"""
        query = (
            select(Estimate, _AMOUNT)
            .select_from(Estimate)
            .join(EstimateItem, col(EstimateItem.estimate_id) == col(Estimate.id), isouter=True)
            .where(
                Estimate.is_deleted == false(),
                col(Estimate.status).in_([EstimateStatus.DRAFT, EstimateStatus.SENT]),
                Estimate.expiry_date >= today,
                Estimate.expiry_date <= until,
            )
            .group_by(col(Estimate.id))
            .order_by(asc(Estimate.expiry_date))
        )
        return [(row[0], int(row[1])) for row in self.session.exec(query).all()]
