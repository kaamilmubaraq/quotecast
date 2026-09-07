from pydantic import BaseModel


class ForecastHistoricalItem(BaseModel):
    year_month: str
    actual_amount: int
    actual_count: int
    predicted_amount: int
    predicted_count: int
    confidence: float


class ForecastPredictionItem(BaseModel):
    year_month: str
    predicted_amount: int
    predicted_count: int
    confidence: float


class MonthlyForecastResponse(BaseModel):
    historical_data: list[ForecastHistoricalItem]
    predictions: list[ForecastPredictionItem]
    trend_analysis: str
