from datetime import date, timedelta
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session

from app.exceptions.exception import Exception404
from app.gateways.db.estimate import EstimateGW
from app.schemas.estimates import (
    CreateEstimateRequest,
    CreateEstimateResponse,
    EstimateListItem,
    GetEstimateResponse,
    GetEstimatesResponse,
    UpdateEstimateRequest,
    UpdateEstimateResponse,
)
from db.models import EstimateCreate, EstimateRead, EstimateUpdate
from db.session import get_session


class EstimateService:
    """見積もりサービスクラス
    責務: ビジネスロジックの実行とトランザクション（コミット）の管理
    """

    def __init__(self, session: Session):
        self.session = session
        self.estimate_gw = EstimateGW(session)

    def get_estimates(self) -> GetEstimatesResponse:
        estimates = self.estimate_gw.get_estimates()

        estimate_list_items = []
        for e in estimates:
            total_amount = sum(item.subtotal for item in e.items)
            estimate_data = e.model_dump()
            estimate_data["total_amount"] = total_amount
            estimate_list_items.append(estimate_data)

        return GetEstimatesResponse(
            estimates=[EstimateListItem.model_validate(e) for e in estimate_list_items]
        )

    def get_estimate(self, estimate_id: UUID) -> GetEstimateResponse:
        estimate = self.estimate_gw.get_estimate(estimate_id)
        if not estimate:
            raise Exception404(f"見積もりID {estimate_id} が見つかりません")

        return GetEstimateResponse(estimate=EstimateRead.model_validate(estimate))

    def create_estimate(self, request: CreateEstimateRequest) -> CreateEstimateResponse:
        # 見積もり番号を自動生成
        estimate_number = self.estimate_gw.generate_estimate_number()

        estimate_create = EstimateCreate(
            estimate_number=estimate_number,
            project_name=request.project_name,
            customer_name=None,
            in_charge_name=None,
            expiry_date=date.today() + timedelta(days=30),
            remarks=None,
        )

        estimate = self.estimate_gw.create_estimate(estimate_create)
        self.session.commit()
        self.session.refresh(estimate)
        return CreateEstimateResponse(estimate=EstimateRead.model_validate(estimate))

    def update_estimate(
        self, estimate_id: UUID, request: UpdateEstimateRequest
    ) -> UpdateEstimateResponse:
        estimate_update = EstimateUpdate.model_validate(request.model_dump(exclude_unset=True))

        estimate = self.estimate_gw.update_estimate(estimate_id, estimate_update)
        if not estimate:
            raise Exception404(f"見積もりID {estimate_id} が見つかりません")

        # 明細項目の更新処理: 既存の明細を削除して新しい明細を追加
        if estimate_update.items is not None:
            self.estimate_gw.delete_estimate_items(estimate_id)
            for item in estimate_update.items:
                self.estimate_gw.create_estimate_item(estimate_id, item)

        self.session.commit()
        self.session.refresh(estimate)
        return UpdateEstimateResponse(estimate=EstimateRead.model_validate(estimate))

    def delete_estimate(self, estimate_id: UUID) -> None:
        estimate = self.estimate_gw.delete_estimate(estimate_id)
        if not estimate:
            raise Exception404(f"見積もりID {estimate_id} が見つかりません")

        self.session.commit()


def get_estimate_service(session: Session = Depends(get_session)) -> EstimateService:
    return EstimateService(session)
