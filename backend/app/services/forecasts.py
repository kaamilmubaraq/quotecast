from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import Depends
from sqlmodel import Session

from algorithm.forecast_algorithm import ForecastAlgorithm, HistoricalDataPoint
from app.gateways.db.forecast import ForecastGW
from app.schemas.forecasts import (
    ForecastHistoricalItem,
    ForecastPredictionItem,
    MonthlyForecastResponse,
)
from db.session import get_session


class ForecastService:
    def __init__(self, session: Session):
        self.forecast_gw = ForecastGW(session)
        self.algorithm = ForecastAlgorithm()

    def get_monthly_forecast(self, months_back: int, months_ahead: int) -> MonthlyForecastResponse:
        end_date = date.today()
        start_date = end_date.replace(day=1) - relativedelta(months=months_back - 1)

        rows = self.forecast_gw.get_monthly_metrics(start_date, end_date)
        metrics = {year_month: (amount, count) for year_month, amount, count in rows}

        # データが存在しない月も0埋めして全ての月を返す
        historical: list[HistoricalDataPoint] = []
        curr = start_date
        while curr <= end_date:
            year_month = curr.strftime("%Y-%m")
            amount, count = metrics.get(year_month, (0, 0))
            historical.append(
                HistoricalDataPoint(
                    year_month=year_month,
                    actual_amount=amount,
                    actual_count=count,
                )
            )
            curr += relativedelta(months=1)

        outcome = self.algorithm.run(historical=historical, months_ahead=months_ahead)
        trend = self.algorithm.analyze_trend(historical)

        # 実績データは予測値を0、信頼度を1.0として返す（グラフ側で予測データと結合するため）
        return MonthlyForecastResponse(
            historical_data=[
                ForecastHistoricalItem(
                    year_month=h.year_month,
                    actual_amount=h.actual_amount,
                    actual_count=h.actual_count,
                    predicted_amount=0,
                    predicted_count=0,
                    confidence=1.0,
                )
                for h in historical
            ],
            predictions=[
                ForecastPredictionItem(
                    year_month=p.year_month,
                    predicted_amount=p.predicted_amount,
                    predicted_count=p.predicted_count,
                    confidence=p.confidence,
                    lower_amount=p.lower_amount,
                    upper_amount=p.upper_amount,
                )
                for p in outcome.predictions
            ],
            trend_analysis=trend.description,
            selected_model=outcome.selected_model,
            backtest_mase=outcome.backtest_mase,
        )


def get_forecast_service(session: Session = Depends(get_session)) -> ForecastService:
    return ForecastService(session)
