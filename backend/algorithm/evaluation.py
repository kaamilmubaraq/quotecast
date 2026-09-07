"""時系列交差検証によるモデル選択

固定のモデルを1つ決め打ちにせず、系列ごとに「実際に当たっていたモデル」を選ぶ。
評価は rolling origin（予測起点をずらしながらの逐次検証）で行う。
学習に使えるのは常に起点より前のデータだけなので、未来の情報は混入しない。

参考: Hyndman, "Cross-validation for time series" (robjhyndman.com/hyndsight/tscv/)
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass

import numpy as np

from algorithm.smoothing import (
    Combination,
    DampedHolt,
    FloatArray,
    ForecastModel,
    Naive,
    SimpleExponentialSmoothing,
    Theta,
)

ModelFactory = Callable[[], ForecastModel]

# 交差検証に必要な最小の学習データ点数
MIN_TRAIN_SIZE = 4

# 比較対象のモデル（この順序が同点時の優先順位になる）
DEFAULT_CANDIDATES: tuple[ModelFactory, ...] = (
    SimpleExponentialSmoothing,
    Naive,
    DampedHolt,
    Theta,
    Combination,
)


@dataclass(frozen=True)
class ModelSelection:
    """モデル選択の結果

    Attributes:
        model: 全データで再学習済みのモデル
        cv_error: 交差検証のMASE。検証できなかった場合は None
    """

    model: ForecastModel
    cv_error: float | None

    @property
    def name(self) -> str:
        return self.model.name


def naive_mae(y: FloatArray) -> float:
    """ナイーブ予測（前月の値をそのまま使う）の平均絶対誤差

    MASEのスケール係数として使う。1.0を超えるMASEは
    「前月の値をそのまま使うより悪い」ことを意味する。
    """
    if y.size < 2:
        return 0.0
    return float(np.mean(np.abs(np.diff(y))))


def rolling_origin_mase(
    factory: ModelFactory,
    y: FloatArray,
    horizon: int,
    min_train: int = MIN_TRAIN_SIZE,
) -> float:
    """rolling origin 交差検証によるMASEを返す

    起点を1ヶ月ずつ進めながら、その時点までのデータだけで学習し、
    最大 horizon ヶ月先までの予測誤差を集計する。

    Returns:
        平均スケール化絶対誤差。検証不能な場合は inf（選択されない）
    """
    model = factory()
    absolute_errors: list[float] = []

    for origin in range(min_train, y.size):
        train = y[:origin]
        if train.size < model.min_observations:
            continue
        steps = min(horizon, y.size - origin)
        predictions = factory().fit(train).forecast(steps)
        absolute_errors.extend(np.abs(y[origin : origin + steps] - predictions).tolist())

    if not absolute_errors:
        return float("inf")

    # 定数系列ではナイーブ誤差が0になるためスケールしない
    # （同一系列内の比較では単調変換なので順位は変わらない）
    scale = naive_mae(y) or 1.0
    return float(np.mean(absolute_errors) / scale)


def select_best_model(
    y: FloatArray,
    horizon: int,
    candidates: Sequence[ModelFactory] = DEFAULT_CANDIDATES,
    min_train: int = MIN_TRAIN_SIZE,
) -> ModelSelection:
    """交差検証でMASEが最小のモデルを選び、全データで再学習して返す

    データ点数が交差検証に足りない場合は、最も頑健な単純指数平滑にフォールバックする。
    """
    viable = [factory for factory in candidates if y.size >= factory().min_observations]
    if not viable:
        return ModelSelection(model=SimpleExponentialSmoothing().fit(y), cv_error=None)

    # 起点が1つも取れない場合は比較のしようがない
    if y.size < min_train + 1:
        return ModelSelection(model=viable[0]().fit(y), cv_error=None)

    best_factory = viable[0]
    best_error = float("inf")
    for factory in viable:
        error = rolling_origin_mase(factory, y, horizon, min_train)
        if error < best_error:
            best_error, best_factory = error, factory

    if np.isinf(best_error):
        return ModelSelection(model=viable[0]().fit(y), cv_error=None)

    return ModelSelection(model=best_factory().fit(y), cv_error=best_error)
