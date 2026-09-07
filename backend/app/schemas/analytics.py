import uuid
from datetime import date

from pydantic import BaseModel

from db.models import EstimateStatus


class StatusBreakdownItem(BaseModel):
    status: EstimateStatus
    count: int
    amount: int


class TopCustomerItem(BaseModel):
    customer_name: str
    count: int
    amount: int


class ExpiringEstimateItem(BaseModel):
    id: uuid.UUID
    estimate_number: str
    project_name: str
    customer_name: str | None = None
    expiry_date: date
    days_remaining: int
    amount: int


class AnalyticsSummaryResponse(BaseModel):
    status_breakdown: list[StatusBreakdownItem]
    win_rate: float | None = None
    pipeline_amount: int = 0
    pipeline_count: int = 0
    won_amount: int = 0
    average_deal_size: int = 0
    top_customers: list[TopCustomerItem] = []
    expiring_soon: list[ExpiringEstimateItem] = []
