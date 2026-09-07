from datetime import date
from typing import Optional, Sequence
from uuid import UUID

from sqlmodel import Session, desc, false, select

from db.models import Estimate, EstimateCreate, EstimateItem, EstimateItemCreate, EstimateUpdate


class EstimateGW:
    def __init__(self, session: Session):
        self.session = session

    def generate_estimate_number(self) -> str:
        """見積もり番号を自動生成する
        フォーマット: EST-YYYYMMDD-XXXX
        XXXXは同日の連番（0001から開始）
        """
        today = date.today()
        prefix = f"EST-{today.strftime('%Y%m%d')}"

        # 同日の最新の見積もり番号を取得
        statement = (
            select(Estimate)
            .where(Estimate.estimate_number.startswith(prefix))
            .order_by(desc(Estimate.estimate_number))
        )
        latest_estimate = self.session.exec(statement).first()

        if latest_estimate and latest_estimate.estimate_number:
            # 既存の番号から連番部分を抽出してインクリメント
            last_number = int(latest_estimate.estimate_number.split("-")[-1])
            sequence = last_number + 1
        else:
            # 初回は1から開始
            sequence = 1

        return f"{prefix}-{sequence:04d}"

    def get_estimates(self, include_deleted: bool = False) -> Sequence[Estimate]:
        statement = select(Estimate)
        if not include_deleted:
            statement = statement.where(Estimate.is_deleted == false())
        statement = statement.order_by(desc(Estimate.created_at))

        return self.session.exec(statement).unique().all()

    def get_estimate(self, estimate_id: UUID) -> Optional[Estimate]:
        statement = select(Estimate).where(
            Estimate.id == estimate_id, Estimate.is_deleted == false()
        )
        return self.session.exec(statement).first()

    def create_estimate(self, estimate: EstimateCreate) -> Estimate:
        db_estimate = Estimate.model_validate(estimate)
        self.session.add(db_estimate)
        self.session.flush()
        self.session.refresh(db_estimate)

        return db_estimate

    def update_estimate(
        self, estimate_id: UUID, estimate_update: EstimateUpdate
    ) -> Optional[Estimate]:
        db_estimate = self.get_estimate(estimate_id)
        if not db_estimate:
            return None

        # items以外のフィールドを更新
        estimate_data = estimate_update.model_dump(exclude_unset=True, exclude={"items"})
        for key, value in estimate_data.items():
            setattr(db_estimate, key, value)

        self.session.add(db_estimate)
        self.session.flush()
        self.session.refresh(db_estimate)
        return db_estimate

    def delete_estimate_items(self, estimate_id: UUID) -> None:
        """指定した見積もりの全明細項目を削除"""
        statement = select(EstimateItem).where(EstimateItem.estimate_id == estimate_id)
        items = self.session.exec(statement).all()
        for item in items:
            self.session.delete(item)
        self.session.flush()

    def create_estimate_item(
        self, estimate_id: UUID, item_create: EstimateItemCreate
    ) -> EstimateItem:
        """見積もりに明細項目を追加"""
        db_item = EstimateItem(**item_create.model_dump(), estimate_id=estimate_id)
        self.session.add(db_item)
        self.session.flush()
        self.session.refresh(db_item)
        return db_item

    def delete_estimate(self, estimate_id: UUID) -> Optional[Estimate]:
        db_estimate = self.get_estimate(estimate_id)
        if not db_estimate:
            return None

        db_estimate.is_deleted = True
        self.session.add(db_estimate)
        self.session.flush()
        self.session.refresh(db_estimate)
        return db_estimate
