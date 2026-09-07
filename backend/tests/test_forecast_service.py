from datetime import date
from typing import Sequence, Tuple, cast

import pytest
from dateutil.relativedelta import relativedelta
from sqlmodel import Session

from app.gateways.db.forecast import ForecastGW
from app.services.forecasts import ForecastService

CURRENT_MONTH = date.today().strftime("%Y-%m")


class FakeForecastGW(ForecastGW):
    """DBに接続せず、固定の集計結果を返すGateway"""

    def __init__(self, rows: Sequence[Tuple[str, int, int]]) -> None:
        self.rows = rows
        self.calls: list[Tuple[date, date]] = []

    def get_monthly_metrics(
        self, start_date: date, end_date: date
    ) -> Sequence[Tuple[str, int, int]]:
        self.calls.append((start_date, end_date))
        return self.rows


def build_service(rows: Sequence[Tuple[str, int, int]] = ()) -> ForecastService:
    """Gatewayを差し替えたServiceを生成する"""
    service = ForecastService(cast(Session, None))
    service.forecast_gw = FakeForecastGW(rows)
    return service


def gateway_of(service: ForecastService) -> FakeForecastGW:
    return cast(FakeForecastGW, service.forecast_gw)


# ---------------------------------------------------------------------------
# 対象期間
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("months_back", [1, 6, 12, 24])
def test_historical_data_has_one_entry_per_month(months_back: int) -> None:
    """データの有無に関わらず、months_back の月数だけ返す"""
    response = build_service().get_monthly_forecast(months_back, months_ahead=3)

    assert len(response.historical_data) == months_back


def test_window_ends_with_the_current_month() -> None:
    """当月を含めた過去Nヶ月を対象とする"""
    response = build_service().get_monthly_forecast(months_back=6, months_ahead=3)

    assert response.historical_data[-1].year_month == CURRENT_MONTH


def test_gateway_receives_a_window_starting_months_back_minus_one() -> None:
    """当月を含むため、開始月は months_back - 1 ヶ月前になる"""
    service = build_service()
    service.get_monthly_forecast(months_back=6, months_ahead=3)

    start_date, end_date = gateway_of(service).calls[0]
    today = date.today()

    assert end_date == today
    assert start_date.day == 1
    assert (today.year - start_date.year) * 12 + (today.month - start_date.month) == 5


def test_months_are_consecutive_and_ascending() -> None:
    """月は昇順で、欠けや重複がない"""
    response = build_service().get_monthly_forecast(months_back=12, months_ahead=3)
    months = [h.year_month for h in response.historical_data]

    for i in range(1, len(months)):
        previous_year, previous_month = map(int, months[i - 1].split("-"))
        current_year, current_month = map(int, months[i].split("-"))
        assert (current_year - previous_year) * 12 + (current_month - previous_month) == 1


# ---------------------------------------------------------------------------
# 実績データ
# ---------------------------------------------------------------------------


def test_months_without_data_are_zero_filled() -> None:
    """データが存在しない月も0埋めして返す（グラフの横軸を欠けさせないため）"""
    response = build_service().get_monthly_forecast(months_back=6, months_ahead=3)

    assert all(h.actual_amount == 0 and h.actual_count == 0 for h in response.historical_data)


def test_gateway_values_are_used_for_the_matching_month() -> None:
    """Gatewayが返した月にはその集計値が入る"""
    service = build_service([(CURRENT_MONTH, 1_234_000, 7)])
    response = service.get_monthly_forecast(months_back=6, months_ahead=3)

    latest = response.historical_data[-1]
    assert latest.year_month == CURRENT_MONTH
    assert latest.actual_amount == 1_234_000
    assert latest.actual_count == 7
    assert all(h.actual_amount == 0 for h in response.historical_data[:-1])


def test_months_outside_the_window_are_ignored() -> None:
    """対象期間外の月がGatewayから返っても無視する"""
    service = build_service([("1999-01", 999_999, 99), (CURRENT_MONTH, 500, 2)])
    response = service.get_monthly_forecast(months_back=3, months_ahead=1)

    assert len(response.historical_data) == 3
    assert "1999-01" not in [h.year_month for h in response.historical_data]


def test_historical_entries_are_padded_for_the_chart() -> None:
    """実績データは予測値0・信頼度1.0で返す（グラフ側で予測データと結合するため）"""
    service = build_service([(CURRENT_MONTH, 500, 2)])
    response = service.get_monthly_forecast(months_back=3, months_ahead=1)

    for historical in response.historical_data:
        assert historical.predicted_amount == 0
        assert historical.predicted_count == 0
        assert historical.confidence == 1.0


def test_each_month_receives_its_own_values() -> None:
    """複数月のデータがそれぞれ対応する月に入る"""
    first_of_month = date.today().replace(day=1)
    months = [(first_of_month - relativedelta(months=i)).strftime("%Y-%m") for i in (2, 1, 0)]

    service = build_service([(months[0], 100, 1), (months[1], 200, 2), (months[2], 300, 3)])
    response = service.get_monthly_forecast(months_back=3, months_ahead=1)

    assert [(h.year_month, h.actual_amount, h.actual_count) for h in response.historical_data] == [
        (months[0], 100, 1),
        (months[1], 200, 2),
        (months[2], 300, 3),
    ]


# ---------------------------------------------------------------------------
# 予測データ
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("months_ahead", [1, 3, 6, 12])
def test_predictions_count_matches_months_ahead(months_ahead: int) -> None:
    service = build_service([(CURRENT_MONTH, 500_000, 5)])
    response = service.get_monthly_forecast(months_back=6, months_ahead=months_ahead)

    assert len(response.predictions) == months_ahead


def test_predictions_start_after_the_last_historical_month() -> None:
    """予測は実績の最終月より後の月から始まる"""
    service = build_service([(CURRENT_MONTH, 500_000, 5)])
    response = service.get_monthly_forecast(months_back=6, months_ahead=3)

    assert response.predictions[0].year_month > response.historical_data[-1].year_month


def test_confidence_stays_within_zero_and_one() -> None:
    service = build_service([(CURRENT_MONTH, 500_000, 5)])
    response = service.get_monthly_forecast(months_back=6, months_ahead=12)

    assert all(0.0 <= p.confidence <= 1.0 for p in response.predictions)


# ---------------------------------------------------------------------------
# トレンド分析
# ---------------------------------------------------------------------------


def test_trend_analysis_is_a_non_empty_string() -> None:
    """trend_analysis は画面にそのまま表示する文字列"""
    service = build_service([(CURRENT_MONTH, 500_000, 5)])
    response = service.get_monthly_forecast(months_back=6, months_ahead=3)

    assert isinstance(response.trend_analysis, str)
    assert response.trend_analysis != ""


def test_trend_analysis_reports_insufficient_data_for_a_single_month() -> None:
    """2ヶ月未満は予測不可である旨を返す"""
    service = build_service([(CURRENT_MONTH, 500_000, 5)])
    response = service.get_monthly_forecast(months_back=1, months_ahead=3)

    assert response.trend_analysis == "データ不足のため、トレンド分析ができません。"


def test_empty_database_still_returns_a_full_response() -> None:
    """見積もりが1件もない場合でもレスポンスの形は変わらない"""
    response = build_service().get_monthly_forecast(months_back=6, months_ahead=3)

    assert len(response.historical_data) == 6
    assert len(response.predictions) == 3
    assert all(p.predicted_amount == 0 for p in response.predictions)
    assert response.trend_analysis != ""
