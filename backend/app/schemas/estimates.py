import uuid

from pydantic import BaseModel

from db.models import EstimateBase, EstimateRead, EstimateStatus, EstimateUpdate


class EstimateListItem(EstimateBase):
    id: uuid.UUID
    status: EstimateStatus
    total_amount: int = 0


class GetEstimatesResponse(BaseModel):
    estimates: list[EstimateListItem]


class GetEstimateResponse(BaseModel):
    estimate: EstimateRead


class UpdateEstimateResponse(BaseModel):
    estimate: EstimateRead


class UpdateEstimateRequest(EstimateUpdate):
    pass


class CreateEstimateRequest(BaseModel):
    project_name: str


class CreateEstimateResponse(BaseModel):
    estimate: EstimateRead
