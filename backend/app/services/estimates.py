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
from db.models import (
    EstimateCreate,
    EstimateItemCreate,
    EstimateRead,
    EstimateStatus,
    EstimateUpdate,
)
from db.session import get_session


class EstimateService:
    """見積もりサービスクラス
    責務: ビジネスロジックの実行とトランザクション（コミット）の管理
    """

    def __init__(self, session: Session):
        self.session = session
        self.estimate_gw = EstimateGW(session)

    def get_estimates(self, search: str | None = None) -> GetEstimatesResponse:
        estimates = self.estimate_gw.get_estimates(search=search)

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

    def duplicate_estimate(self, estimate_id: UUID) -> CreateEstimateResponse:
        """既存の見積もりを下書きとして複製する

        番号は新規採番し、発行日は本日、有効期限は30日後に引き直す。
        金額の再入力が要らないよう、明細はそのまま引き継ぐ。
        """
        source = self.estimate_gw.get_estimate(estimate_id)
        if not source:
            raise Exception404(f"見積もりID {estimate_id} が見つかりません")

        estimate_create = EstimateCreate(
            estimate_number=self.estimate_gw.generate_estimate_number(),
            status=EstimateStatus.DRAFT,
            project_name=f"{source.project_name}（コピー）",
            customer_name=source.customer_name,
            in_charge_name=source.in_charge_name,
            issue_date=date.today(),
            expiry_date=date.today() + timedelta(days=30),
            remarks=source.remarks,
        )
        duplicated = self.estimate_gw.create_estimate(estimate_create)

        for item in source.items:
            self.estimate_gw.create_estimate_item(
                duplicated.id,
                EstimateItemCreate(
                    item_name=item.item_name,
                    price=item.price,
                    quantity=item.quantity,
                    category_id=item.category_id,
                ),
            )

        self.session.commit()
        self.session.refresh(duplicated)
        return CreateEstimateResponse(estimate=EstimateRead.model_validate(duplicated))

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
