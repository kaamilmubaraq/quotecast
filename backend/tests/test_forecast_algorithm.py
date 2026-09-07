"""需要予測アルゴリズムのテスト

予測値そのものを固定値で検証すると、モデルを改良するたびにテストが壊れる。
そのため「予測が満たすべき性質」（単調性・区間の整合性・決定性など）を検証する。
"""

from datetime import date

import numpy as np
import pytest

from algorithm.evaluation import (
    MIN_TRAIN_SIZE,
    ModelSelection,
    naive_mae,
    rolling_origin_mase,
    select_best_model,
)
from algorithm.forecast_algorithm import (
    INSUFFICIENT_DATA_MESSAGE,
    ForecastAlgorithm,
    HistoricalDataPoint,
)
from algorithm.smoothing import (
    Combination,
    DampedHolt,
    ForecastModel,
    Naive,
    SimpleExponentialSmoothing,
    Theta,
)

ALL_MODELS = [SimpleExponentialSmoothing, Naive, DampedHolt, Theta, Combination]

RISING = np.array([100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0])
FLAT = np.array([100.0, 98.0, 103.0, 99.0, 101.0, 100.0, 102.0, 97.0])
FALLING = np.array([240.0, 220.0, 200.0, 180.0, 160.0, 140.0, 120.0, 100.0])


def months(count: int, start: tuple[int, int] = (2020, 1)) -> list[str]:
    """当月補正の影響を受けない過去の年月ラベルを作る"""
    year, month = start
    labels = []
    for _ in range(count):
        labels.append(f"{year}-{month:02d}")
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return labels


def history(values: list[int], counts: list[int] | None = None) -> list[HistoricalDataPoint]:
    labels = months(len(values))
    counts = counts or [max(1, value // 10000) for value in values]
    return [
        HistoricalDataPoint(year_month=labels[i], actual_amount=values[i], actual_count=counts[i])
        for i in range(len(values))
    ]


# ---------------------------------------------------------------------------
# 個別モデル
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("factory", ALL_MODELS)
def test_forecast_returns_requested_number_of_steps(factory: type[ForecastModel]) -> None:
    model = factory().fit(RISING)

    assert model.forecast(5).shape == (5,)
    assert model.forecast_variance(5).shape == (5,)


@pytest.mark.parametrize("factory", ALL_MODELS)
def test_forecast_variance_is_positive_and_non_decreasing(factory: type[ForecastModel]) -> None:
    """予測分散は先に行くほど大きくなる（不確実性は増える一方）"""
    variance = factory().fit(RISING).forecast_variance(6)

    assert np.all(variance > 0)
    assert np.all(np.diff(variance) >= -1e-9)


@pytest.mark.parametrize("factory", ALL_MODELS)
def test_constant_series_is_forecast_exactly(factory: type[ForecastModel]) -> None:
    """定数系列は誤差なく予測できる"""
    constant = np.full(8, 500.0)

    forecast = factory().fit(constant).forecast(3)

    assert np.allclose(forecast, 500.0)


def test_simple_exponential_smoothing_forecast_is_flat() -> None:
    """単純指数平滑はトレンドを持たないため水平線になる"""
    forecast = SimpleExponentialSmoothing().fit(RISING).forecast(4)

    assert np.allclose(forecast, forecast[0])


def test_simple_exponential_smoothing_level_stays_within_observed_range() -> None:
    model = SimpleExponentialSmoothing().fit(RISING)

    assert RISING.min() <= model.level <= RISING.max()


def test_naive_forecasts_the_last_observation() -> None:
    model = Naive().fit(RISING)

    assert np.allclose(model.forecast(3), RISING[-1])


def test_naive_variance_grows_linearly() -> None:
    """ランダムウォークの分散は h に比例する"""
    model = Naive().fit(FLAT)
    variance = model.forecast_variance(3)

    assert variance == pytest.approx(model.sigma2 * np.array([1.0, 2.0, 3.0]))


def test_damped_holt_follows_an_upward_trend() -> None:
    forecast = DampedHolt().fit(RISING).forecast(3)

    assert forecast[0] > RISING[-1]
    assert np.all(np.diff(forecast) > 0)


def test_damped_holt_trend_converges_instead_of_diverging() -> None:
    """減衰トレンドは ℓ + b·φ/(1-φ) に収束する（線形外挿なら無限に発散する）"""
    model = DampedHolt().fit(RISING)
    forecast = model.forecast(200)
    increments = np.diff(forecast)

    limit = model.level + model.trend * model.phi / (1.0 - model.phi)

    assert increments[-1] < increments[0]
    assert forecast[-1] <= limit + 1e-6
    assert forecast[-1] == pytest.approx(limit, rel=0.05)


def test_theta_forecast_lies_between_its_two_lines() -> None:
    """Theta法は回帰直線とSESの水準の中点になる"""
    model = Theta().fit(RISING)
    horizon = 3
    steps = np.arange(1, horizon + 1, dtype=np.float64)
    trend_line = model.intercept + model.slope * (RISING.size - 1 + steps)

    forecast = model.forecast(horizon)

    assert np.allclose(forecast, 0.5 * trend_line + 0.5 * model.level)


def test_combination_is_the_mean_of_its_members() -> None:
    model = Combination().fit(RISING)
    member_forecasts = [member.forecast(3) for member in model.members]

    assert np.allclose(model.forecast(3), np.mean(member_forecasts, axis=0))


def test_combination_uses_three_members() -> None:
    model = Combination().fit(RISING)

    assert [member.name for member in model.members] == [
        SimpleExponentialSmoothing.name,
        DampedHolt.name,
        Theta.name,
    ]


def test_fitted_values_have_the_same_length_as_the_input() -> None:
    model = SimpleExponentialSmoothing().fit(RISING)

    assert model.fitted.shape == RISING.shape


# ---------------------------------------------------------------------------
# モデル選択
# ---------------------------------------------------------------------------


def test_naive_mae_is_the_mean_absolute_month_over_month_change() -> None:
    assert naive_mae(np.array([10.0, 12.0, 11.0])) == pytest.approx((2.0 + 1.0) / 2)


def test_naive_mae_of_a_single_point_is_zero() -> None:
    assert naive_mae(np.array([10.0])) == 0.0


def test_rolling_origin_mase_is_zero_for_a_perfectly_predictable_series() -> None:
    """定数系列はどのモデルでも当たるため誤差0"""
    constant = np.full(10, 300.0)

    assert rolling_origin_mase(SimpleExponentialSmoothing, constant, horizon=2) == 0.0


def test_rolling_origin_mase_is_infinite_when_no_origin_can_be_evaluated() -> None:
    """学習点数がモデルの要求を満たさない場合は選択対象から外れる"""
    short = np.array([1.0, 2.0, 3.0])

    assert rolling_origin_mase(DampedHolt, short, horizon=2, min_train=2) == float("inf")


def test_select_best_model_returns_a_fitted_model_and_its_score() -> None:
    selection = select_best_model(RISING, horizon=3)

    assert isinstance(selection, ModelSelection)
    assert selection.cv_error is not None
    assert selection.name == selection.model.name
    assert selection.model.forecast(3).shape == (3,)


def test_select_best_model_prefers_a_trend_model_on_a_clear_trend() -> None:
    """一貫した上昇トレンドでは、水平予測より外挿するモデルが選ばれる"""
    selection = select_best_model(RISING, horizon=3)

    assert selection.name in {DampedHolt.name, Theta.name, Combination.name}


def test_select_best_model_falls_back_without_cross_validation_when_data_is_short() -> None:
    """起点が取れない短い系列では検証できないためスコアは None"""
    selection = select_best_model(np.array([10.0, 20.0, 30.0]), horizon=2)

    assert selection.cv_error is None


def test_select_best_model_handles_a_series_too_short_for_any_model() -> None:
    selection = select_best_model(np.array([42.0]), horizon=2)

    assert selection.cv_error is None
    assert selection.name == SimpleExponentialSmoothing.name


def test_select_best_model_falls_back_when_every_candidate_is_unevaluable() -> None:
    selection = select_best_model(
        np.array([1.0, 2.0, 3.0]), horizon=2, candidates=(DampedHolt,), min_train=2
    )

    assert selection.cv_error is None
    assert selection.name == DampedHolt.name


def test_min_train_size_allows_cross_validation_at_the_default_window() -> None:
    """既定の過去6ヶ月でも交差検証が動くこと"""
    selection = select_best_model(RISING[:6], horizon=3, min_train=MIN_TRAIN_SIZE)

    assert selection.cv_error is not None


# ---------------------------------------------------------------------------
# 前処理（当月の扱い）
# ---------------------------------------------------------------------------


def test_current_month_is_scaled_up_to_a_full_month() -> None:
    """月途中の実績は月全体に換算する（6月15日 → 30/15 = 2倍）"""
    algorithm = ForecastAlgorithm()
    historical = [
        HistoricalDataPoint(year_month="2024-05", actual_amount=1000, actual_count=10),
        HistoricalDataPoint(year_month="2024-06", actual_amount=500, actual_count=5),
    ]

    fitting = algorithm.build_fitting_series(historical, today=date(2024, 6, 15))

    assert fitting[-1].actual_amount == 1000
    assert fitting[-1].actual_count == 10


def test_barely_started_month_is_dropped_instead_of_extrapolated() -> None:
    """経過が浅い月は換算倍率が大きすぎるため学習から外す"""
    algorithm = ForecastAlgorithm()
    historical = [
        HistoricalDataPoint(year_month="2024-05", actual_amount=1000, actual_count=10),
        HistoricalDataPoint(year_month="2024-06", actual_amount=100, actual_count=1),
    ]

    fitting = algorithm.build_fitting_series(historical, today=date(2024, 6, 2))

    assert [point.year_month for point in fitting] == ["2024-05"]


def test_completed_months_are_left_untouched() -> None:
    algorithm = ForecastAlgorithm()
    historical = [
        HistoricalDataPoint(year_month="2024-05", actual_amount=1000, actual_count=10),
        HistoricalDataPoint(year_month="2024-06", actual_amount=500, actual_count=5),
    ]

    fitting = algorithm.build_fitting_series(historical, today=date(2024, 7, 10))

    assert fitting == historical


def test_last_day_of_the_month_needs_no_adjustment() -> None:
    algorithm = ForecastAlgorithm()
    historical = [HistoricalDataPoint(year_month="2024-06", actual_amount=900, actual_count=9)]

    fitting = algorithm.build_fitting_series(historical, today=date(2024, 6, 30))

    assert fitting[-1].actual_amount == 900


def test_empty_history_produces_an_empty_fitting_series() -> None:
    assert ForecastAlgorithm().build_fitting_series([]) == []


# ---------------------------------------------------------------------------
# 予測
# ---------------------------------------------------------------------------


def test_predictions_cover_the_requested_horizon() -> None:
    predictions = ForecastAlgorithm().generate_predictions(history([100, 200, 300, 400]), 3)

    assert len(predictions) == 3


def test_predicted_months_are_consecutive_and_follow_the_history() -> None:
    predictions = ForecastAlgorithm().generate_predictions(history([100, 200, 300, 400]), 3)

    assert [p.year_month for p in predictions] == ["2020-05", "2020-06", "2020-07"]


def test_predictions_are_deterministic() -> None:
    """同じ入力からは常に同じ結果が出る（旧実装は乱数で単価を揺らしていた）"""
    algorithm = ForecastAlgorithm()
    historical = history([100_000, 130_000, 120_000, 160_000, 150_000, 190_000])

    first = algorithm.generate_predictions(historical, 4)
    second = algorithm.generate_predictions(historical, 4)

    assert [p.predicted_amount for p in first] == [p.predicted_amount for p in second]


def test_prediction_interval_contains_the_point_forecast() -> None:
    predictions = ForecastAlgorithm().generate_predictions(
        history([100_000, 130_000, 120_000, 160_000, 150_000, 190_000]), 3
    )

    for prediction in predictions:
        assert prediction.lower_amount <= prediction.predicted_amount <= prediction.upper_amount


def test_prediction_interval_widens_with_the_horizon() -> None:
    """先の予測ほど不確実性が大きい"""
    predictions = ForecastAlgorithm().generate_predictions(
        history([100_000, 130_000, 120_000, 160_000, 150_000, 190_000]), 6
    )
    widths = [p.upper_amount - p.lower_amount for p in predictions]

    assert widths[-1] > widths[0]


def test_confidence_decreases_with_the_horizon() -> None:
    predictions = ForecastAlgorithm().generate_predictions(
        history([100_000, 130_000, 120_000, 160_000, 150_000, 190_000]), 6
    )
    confidences = [p.confidence for p in predictions]

    assert all(a >= b for a, b in zip(confidences, confidences[1:], strict=False))


def test_confidence_is_lower_for_a_noisier_series() -> None:
    """変動が大きい系列ほど信頼度は低くなる"""
    algorithm = ForecastAlgorithm()
    stable = algorithm.generate_predictions(history([100_000] * 6), 3)
    noisy = algorithm.generate_predictions(
        history([20_000, 300_000, 50_000, 400_000, 30_000, 250_000]), 3
    )

    assert noisy[0].confidence < stable[0].confidence


def test_confidence_stays_within_the_configured_bounds() -> None:
    algorithm = ForecastAlgorithm(min_confidence=0.3, max_confidence=0.95)
    predictions = algorithm.generate_predictions(
        history([20_000, 300_000, 50_000, 400_000, 30_000, 250_000]), 12
    )

    assert all(0.3 <= p.confidence <= 0.95 for p in predictions)


def test_predictions_are_never_negative() -> None:
    """需要は負にならない（急な下降トレンドでも0で止める）"""
    predictions = ForecastAlgorithm().generate_predictions(
        history([500_000, 400_000, 300_000, 200_000, 100_000, 10_000]), 12
    )

    assert all(p.predicted_amount >= 0 and p.predicted_count >= 0 for p in predictions)


def test_empty_history_still_returns_predictions() -> None:
    predictions = ForecastAlgorithm().generate_predictions([], 3)

    assert len(predictions) == 3
    assert all(p.predicted_amount == 0 and p.predicted_count == 0 for p in predictions)


def test_all_zero_history_predicts_zero() -> None:
    """実績が1件も無い場合、予測は0（そこから外挿はできない）"""
    predictions = ForecastAlgorithm().generate_predictions(history([0, 0, 0, 0, 0, 0]), 3)

    assert all(p.predicted_amount == 0 for p in predictions)
    assert all(p.lower_amount == 0 and p.upper_amount == 0 for p in predictions)


def test_single_month_of_history_cannot_be_extrapolated() -> None:
    predictions = ForecastAlgorithm().generate_predictions(history([500_000]), 2)

    assert all(p.predicted_amount == 0 for p in predictions)


def test_a_steady_series_is_forecast_near_its_own_level() -> None:
    """横ばいの系列は同じ水準が続くと予測される"""
    predictions = ForecastAlgorithm().generate_predictions(history([100_000] * 6), 3)

    assert all(p.predicted_amount == pytest.approx(100_000, rel=0.05) for p in predictions)


def test_a_rising_series_is_forecast_above_its_last_value() -> None:
    historical = history([100_000, 150_000, 200_000, 250_000, 300_000, 350_000])

    predictions = ForecastAlgorithm().generate_predictions(historical, 3)

    assert predictions[0].predicted_amount > 300_000


def test_run_reports_the_chosen_model() -> None:
    outcome = ForecastAlgorithm().run(history([100, 200, 300, 400, 500, 600]), 3)

    assert outcome.selected_model != ""
    assert outcome.backtest_mase is not None
    assert len(outcome.predictions) == 3


def test_run_reports_insufficient_data_without_usable_history() -> None:
    outcome = ForecastAlgorithm().run(history([0, 0, 0]), 3)

    assert outcome.selected_model == "データ不足"
    assert outcome.backtest_mase is None


# ---------------------------------------------------------------------------
# トレンド分析
# ---------------------------------------------------------------------------


def test_rising_series_is_reported_as_an_uptrend() -> None:
    result = ForecastAlgorithm().analyze_trend(history([int(v) for v in RISING]))

    assert result.trend == "上昇トレンド"
    assert result.slope > 0


def test_falling_series_is_reported_as_a_downtrend() -> None:
    result = ForecastAlgorithm().analyze_trend(history([int(v) for v in FALLING]))

    assert result.trend == "下降トレンド"
    assert result.slope < 0


def test_noise_without_direction_is_reported_as_flat() -> None:
    """わずかな傾きは偶然の範囲内として横ばいと判定する"""
    result = ForecastAlgorithm().analyze_trend(history([int(v) for v in FLAT]))

    assert result.trend == "横ばい"


def test_a_perfectly_flat_series_is_reported_as_flat() -> None:
    result = ForecastAlgorithm().analyze_trend(history([100] * 6))

    assert result.trend == "横ばい"
    assert result.slope == pytest.approx(0.0, abs=1e-9)


def test_two_points_are_judged_by_the_size_of_the_change() -> None:
    """2点では誤差を推定できないため、平均に対する変化の大きさで判断する"""
    algorithm = ForecastAlgorithm()

    assert algorithm.analyze_trend(history([100, 1000])).trend == "上昇トレンド"
    assert algorithm.analyze_trend(history([1000, 1001])).trend == "横ばい"


def test_a_single_month_reports_insufficient_data() -> None:
    result = ForecastAlgorithm().analyze_trend(history([500_000]))

    assert result.description == INSUFFICIENT_DATA_MESSAGE
    assert result.trend == "不明"
    assert result.volatility == "不明"


def test_volatility_is_reported_as_high_for_a_swinging_series() -> None:
    result = ForecastAlgorithm().analyze_trend(history([10_000, 500_000, 20_000, 600_000]))

    assert result.volatility == "高い"


def test_volatility_is_reported_as_low_for_a_steady_series() -> None:
    result = ForecastAlgorithm().analyze_trend(history([100_000, 102_000, 99_000, 101_000]))

    assert result.volatility == "低い"


def test_description_includes_the_monthly_average() -> None:
    result = ForecastAlgorithm().analyze_trend(history([100_000, 200_000, 300_000]))

    assert "月平均: ¥200,000" in result.description


def test_zero_series_does_not_divide_by_zero() -> None:
    result = ForecastAlgorithm().analyze_trend(history([0, 0, 0, 0]))

    assert result.volatility == "低い"
    assert result.average_amount == 0.0
