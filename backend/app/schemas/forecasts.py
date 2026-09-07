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
    lower_amount: int = 0
    upper_amount: int = 0


class MonthlyForecastResponse(BaseModel):
    historical_data: list[ForecastHistoricalItem]
    predictions: list[ForecastPredictionItem]
    trend_analysis: str
    selected_model: str = ""
    backtest_mase: float | None = None
