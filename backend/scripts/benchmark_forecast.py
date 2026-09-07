"""需要予測エンジンのベンチマーク

予測手法の評価は、標準的なベンチマークに勝てているかどうかで測る。
ここでは代表的な5つの需要パターンに対して rolling origin 交差検証を行い、
予測コンペティションで標準的に使われる3つのベースラインと比較する。

    - ナイーブ: 直近の実績をそのまま延長する（ランダムウォーク）
    - 平均:     過去の平均値を予測とする
    - ドリフト: 最初と最後を結んだ直線を延長する

指標は MASE（平均絶対スケール化誤差）。1.0 がナイーブ予測と同等で、
小さいほど良い。実務ではナイーブに勝てない予測モデルは珍しくないため、
1.0 を下回るかどうかが最初の関門になる。

実行方法:
    docker compose exec backend uv run python scripts/benchmark_forecast.py
"""

from __future__ import annotations

import sys
from collections.abc import Callable
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from algorithm.evaluation import select_best_model  # noqa: E402
from algorithm.smoothing import FloatArray  # noqa: E402

Baseline = Callable[[FloatArray, int], FloatArray]

HORIZON = 3
MIN_TRAIN = 6
SERIES_LENGTH = 30


def naive(train: FloatArray, horizon: int) -> FloatArray:
    """直近の実績をそのまま延長する"""
    return np.full(horizon, train[-1], dtype=np.float64)


def mean_baseline(train: FloatArray, horizon: int) -> FloatArray:
    """過去の平均値を予測とする"""
    return np.full(horizon, float(np.mean(train)), dtype=np.float64)


def drift(train: FloatArray, horizon: int) -> FloatArray:
    """最初と最後を結んだ直線を延長する"""
    if train.size < 2:
        return naive(train, horizon)
    slope = (train[-1] - train[0]) / (train.size - 1)
    return train[-1] + slope * np.arange(1, horizon + 1, dtype=np.float64)


def quotecast(train: FloatArray, horizon: int) -> FloatArray:
    """本アプリのエンジン（交差検証でモデルを選択して予測）"""
    return select_best_model(train, horizon).model.forecast(horizon)


BASELINES: dict[str, Baseline] = {
    "ナイーブ": naive,
    "平均": mean_baseline,
    "ドリフト": drift,
    "QuoteCast": quotecast,
}


def make_series(kind: str, length: int = SERIES_LENGTH) -> FloatArray:
    """検証用の月次系列を決定的に生成する"""
    rng = np.random.RandomState(42)
    t = np.arange(length)

    if kind == "上昇トレンド":
        base = 800_000 + 40_000 * t
    elif kind == "下降トレンド":
        base = 2_000_000 - 45_000 * t
    elif kind == "横ばい":
        base = np.full(length, 1_000_000.0)
    elif kind == "水準シフト":
        base = np.where(t < length // 2, 700_000.0, 1_600_000.0)
    elif kind == "高変動":
        base = 1_000_000 + 300_000 * np.sin(t / 2.0)
    else:
        raise ValueError(f"unknown series: {kind}")

    return np.maximum(base + rng.normal(0, 90_000, length), 0.0)


def backtest(forecaster: Baseline, y: FloatArray, horizon: int, min_train: int) -> FloatArray:
    """rolling origin で予測誤差を集計する

    起点を1ヶ月ずつ進めながら、その時点までのデータだけで予測する。
    未来のデータは学習に使わない。
    """
    errors: list[float] = []
    for origin in range(min_train, y.size - horizon + 1):
        predictions = forecaster(y[:origin], horizon)
        errors.extend(np.abs(y[origin : origin + horizon] - predictions).tolist())
    return np.array(errors, dtype=np.float64)


def main() -> None:
    kinds = ["上昇トレンド", "下降トレンド", "横ばい", "水準シフト", "高変動"]
    names = list(BASELINES)
    totals: dict[str, list[float]] = {name: [] for name in names}

    header = f"{'需要パターン':<14}" + "".join(f"{name:>12}" for name in names)
    print(header)
    print("-" * len(header))

    for kind in kinds:
        y = make_series(kind)
        scale = float(np.mean(np.abs(np.diff(y))))
        row = f"{kind:<14}"
        for name in names:
            scaled = backtest(BASELINES[name], y, HORIZON, MIN_TRAIN) / scale
            totals[name].extend(scaled.tolist())
            row += f"{float(np.mean(scaled)):>12.3f}"
        print(row)

    print("-" * len(header))
    print(f"{'全体':<14}" + "".join(f"{float(np.mean(totals[n])):>12.3f}" for n in names))
    print("\nMASE（小さいほど良い）。1.000 = ナイーブ予測と同等")
    print(f"検証条件: {HORIZON}ヶ月先予測 / 学習{MIN_TRAIN}ヶ月以上 / 系列長{SERIES_LENGTH}ヶ月")


if __name__ == "__main__":
    main()
