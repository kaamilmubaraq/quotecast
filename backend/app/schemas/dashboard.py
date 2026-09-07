from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_count: int
    current_month_count: int
    total_amount: int
    average_amount: int


class GraphItem(BaseModel):
    month: str
    count: int
    amount: int


class DashboardGraphResponse(BaseModel):
    graph_items: list[GraphItem]
