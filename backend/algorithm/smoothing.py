"""指数平滑法にもとづく時系列予測モデル群

すべてのモデルは共通のインターフェース（fit / forecast / forecast_variance）を持ち、
`evaluation.select_best_model` が時系列交差検証でモデルを選択する。

予測区間は各モデルの状態空間表現から導出した予測分散にもとづく。
経験的なペナルティではなく残差分散から算出するため、
データが安定していれば区間は狭く、変動が大きければ広くなる。

参考文献:
- Hyndman & Athanasopoulos (2021) Forecasting: Principles and Practice, 3rd ed., ch.8
- Hyndman & Billah (2003) Unmasking the Theta method, Int. J. Forecasting 19(2)
- Assimakopoulos & Nikolopoulos (2000) The theta model, Int. J. Forecasting 16(4)
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]

# 平滑化パラメータの探索グリッド（SSE最小化。scipy非依存で決定的に解を得る）
ALPHA_GRID: FloatArray = np.round(np.arange(0.10, 1.00, 0.05), 2)
BETA_GRID: FloatArray = np.round(np.arange(0.05, 0.95, 0.10), 2)
# 減衰パラメータ φ は実務上 0.80〜0.98 に制限する（FPP3 §8.2）
PHI_GRID: FloatArray = np.array([0.80, 0.85, 0.90, 0.95, 0.98])


class ForecastModel(ABC):
    """1変量時系列モデルの共通インターフェース

    Attributes:
        name: 交差検証の結果表示に使うモデル名
        min_observations: 学習に必要な最小データ点数
        burn_in: 初期値の推定に使うため残差評価から除外する先頭の点数
    """

    name: str = "base"
    min_observations: int = 2
    burn_in: int = 1

    def __init__(self) -> None:
        self._fitted: FloatArray = np.zeros(0)
        self._sigma2: float = 0.0
        self._n: int = 0

    @property
    def sigma2(self) -> float:
        """1期先予測誤差の分散推定値"""
        return self._sigma2

    @property
    def fitted(self) -> FloatArray:
        """in-sampleの1期先予測値"""
        return self._fitted

    @abstractmethod
    def fit(self, y: FloatArray) -> ForecastModel:
        """パラメータを推定する（自身を返す）"""

    @abstractmethod
    def forecast(self, h: int) -> FloatArray:
        """h期先までの点予測を返す"""

    @abstractmethod
    def forecast_variance(self, h: int) -> FloatArray:
        """h期先までの予測分散を返す"""

    def _store_residuals(self, y: FloatArray, fitted: FloatArray, n_params: int) -> None:
        """残差分散を推定する

        初期値の推定に使った先頭 burn_in 点は残差が構造的に0に近くなるため除外する。
        自由度は n - パラメータ数 で補正する（小標本での過小評価を避けるため）。
        """
        self._fitted = fitted
        self._n = y.size
        residuals = y[self.burn_in :] - fitted[self.burn_in :]
        dof = max(residuals.size - n_params, 1)
        self._sigma2 = float(np.sum(residuals**2) / dof)


def _ses_recursion(y: FloatArray, alpha: float) -> tuple[FloatArray, float]:
    """単純指数平滑のレベル再帰

    ℓ_t = α·y_t + (1-α)·ℓ_{t-1} 、 1期先予測は ŷ_t = ℓ_{t-1}

    Returns:
        (in-sampleの1期先予測値, 最終レベル ℓ_n)
    """
    fitted = np.empty(y.size, dtype=np.float64)
    level = float(y[0])
    for t in range(y.size):
        fitted[t] = level
        level = alpha * float(y[t]) + (1.0 - alpha) * level
    return fitted, level


def _sse(y: FloatArray, fitted: FloatArray, burn_in: int) -> float:
    """パラメータ最適化の目的関数（残差平方和）"""
    residuals = y[burn_in:] - fitted[burn_in:]
    return float(np.sum(residuals**2))


class SimpleExponentialSmoothing(ForecastModel):
    """単純指数平滑 ETS(A,N,N)

    トレンドを仮定せず水準のみを追従するため、予測は水平線になる。
    ノイズが大きくトレンドが不明瞭な系列で最も頑健なベースライン。

    予測分散: σ²_h = σ²[1 + α²(h-1)]（FPP3 §8.7）
    """

    name = "単純指数平滑"
    min_observations = 2
    burn_in = 1

    def __init__(self) -> None:
        super().__init__()
        self.alpha: float = 0.5
        self.level: float = 0.0

    def fit(self, y: FloatArray) -> SimpleExponentialSmoothing:
        best_sse = np.inf
        best_alpha = float(ALPHA_GRID[0])
        best_fitted, best_level = _ses_recursion(y, best_alpha)

        for alpha in ALPHA_GRID:
            fitted, level = _ses_recursion(y, float(alpha))
            sse = _sse(y, fitted, self.burn_in)
            if sse < best_sse:
                best_sse, best_alpha = sse, float(alpha)
                best_fitted, best_level = fitted, level

        self.alpha, self.level = best_alpha, best_level
        self._store_residuals(y, best_fitted, n_params=1)
        return self

    def forecast(self, h: int) -> FloatArray:
        return np.full(h, self.level, dtype=np.float64)

    def forecast_variance(self, h: int) -> FloatArray:
        steps = np.arange(1, h + 1, dtype=np.float64)
        return self._sigma2 * (1.0 + self.alpha**2 * (steps - 1.0))


class DampedHolt(ForecastModel):
    """減衰トレンド指数平滑 ETS(A,Ad,N)

    ℓ_t = α·y_t + (1-α)(ℓ_{t-1} + φ·b_{t-1})
    b_t = β*(ℓ_t - ℓ_{t-1}) + (1-β*)·φ·b_{t-1}
    ŷ_{t+h} = ℓ_t + (φ + φ² + ... + φ^h)·b_t

    トレンドを外挿しつつ φ で減衰させるため、長期予測が発散しない。
    M4コンペティションでも上位に入る堅実な手法。
    """

    name = "減衰トレンド"
    min_observations = 3
    burn_in = 2

    def __init__(self) -> None:
        super().__init__()
        self.alpha: float = 0.5
        self.beta: float = 0.1
        self.phi: float = 0.9
        self.level: float = 0.0
        self.trend: float = 0.0

    @staticmethod
    def _recursion(
        y: FloatArray, alpha: float, beta: float, phi: float
    ) -> tuple[FloatArray, float, float]:
        fitted = np.empty(y.size, dtype=np.float64)
        level = float(y[0])
        trend = float(y[1] - y[0])
        fitted[0] = level
        for t in range(1, y.size):
            prediction = level + phi * trend
            fitted[t] = prediction
            previous_level = level
            level = alpha * float(y[t]) + (1.0 - alpha) * prediction
            trend = beta * (level - previous_level) + (1.0 - beta) * phi * trend
        return fitted, level, trend

    def fit(self, y: FloatArray) -> DampedHolt:
        best_sse = np.inf
        best_params = (float(ALPHA_GRID[0]), float(BETA_GRID[0]), float(PHI_GRID[0]))
        best_state = self._recursion(y, *best_params)

        for alpha in ALPHA_GRID:
            for beta in BETA_GRID:
                for phi in PHI_GRID:
                    state = self._recursion(y, float(alpha), float(beta), float(phi))
                    sse = _sse(y, state[0], self.burn_in)
                    if sse < best_sse:
                        best_sse = sse
                        best_params = (float(alpha), float(beta), float(phi))
                        best_state = state

        self.alpha, self.beta, self.phi = best_params
        _, self.level, self.trend = best_state
        self._store_residuals(y, best_state[0], n_params=3)
        return self

    def forecast(self, h: int) -> FloatArray:
        # φ + φ² + ... + φ^h（減衰係数の累積和）
        damping = np.cumsum(self.phi ** np.arange(1, h + 1, dtype=np.float64))
        return self.level + damping * self.trend

    def forecast_variance(self, h: int) -> FloatArray:
        """ETS(A,Ad,N)の予測分散（FPP3 §8.7）

        状態空間表現の β は手法形の β* とは異なり β = α·β* である点に注意。
        """
        alpha, phi = self.alpha, self.phi
        beta = self.alpha * self.beta
        steps = np.arange(1, h + 1, dtype=np.float64)

        gap = 1.0 - phi
        term_linear = alpha**2 * (steps - 1.0)
        term_trend = beta * phi * steps / gap**2 * (2.0 * alpha * gap + beta * phi)
        phi_h = phi**steps
        term_damping = (
            beta
            * phi
            * (1.0 - phi_h)
            / (gap**2 * (1.0 - phi**2))
            * (2.0 * alpha * (1.0 - phi**2) + beta * phi * (1.0 + 2.0 * phi - phi_h))
        )
        return self._sigma2 * (1.0 + term_linear + term_trend - term_damping)


class Theta(ForecastModel):
    """Theta法（古典的な2本線バージョン）

    系列を2本のシータ線に分解して外挿し、等加重で結合する:
      - Θ=0 線: 最小二乗回帰直線 → そのまま外挿（長期トレンド）
      - Θ=2 線: Z_t = 2·y_t - (a + b·t) → 単純指数平滑で外挿（短期の水準）

    M3コンペティション優勝手法で、M4でも月次データで最良の成績を収めた。
    Hyndman & Billah (2003) によりドリフト付き単純指数平滑と等価であることが示されている。
    """

    name = "Theta法"
    min_observations = 3
    burn_in = 1

    def __init__(self) -> None:
        super().__init__()
        self.alpha: float = 0.5
        self.intercept: float = 0.0
        self.slope: float = 0.0
        self.level: float = 0.0

    def fit(self, y: FloatArray) -> Theta:
        time_index = np.arange(y.size, dtype=np.float64)

        # Θ=0 線: 最小二乗回帰直線
        coefficients = np.polyfit(time_index, y, 1)
        self.slope, self.intercept = float(coefficients[0]), float(coefficients[1])
        trend_line = self.intercept + self.slope * time_index

        # Θ=2 線に単純指数平滑を当てはめる
        theta_two = 2.0 * y - trend_line
        best_sse = np.inf
        best_alpha = float(ALPHA_GRID[0])
        best_fitted, best_level = _ses_recursion(theta_two, best_alpha)

        for alpha in ALPHA_GRID:
            fitted, level = _ses_recursion(theta_two, float(alpha))
            sse = _sse(theta_two, fitted, self.burn_in)
            if sse < best_sse:
                best_sse, best_alpha = sse, float(alpha)
                best_fitted, best_level = fitted, level

        self.alpha, self.level = best_alpha, best_level
        # 2本線の等加重平均が最終的な当てはめ値になる
        self._store_residuals(y, 0.5 * (trend_line + best_fitted), n_params=2)
        return self

    def forecast(self, h: int) -> FloatArray:
        steps = np.arange(1, h + 1, dtype=np.float64)
        trend_extrapolation = self.intercept + self.slope * (self._n - 1.0 + steps)
        return 0.5 * trend_extrapolation + 0.5 * self.level

    def forecast_variance(self, h: int) -> FloatArray:
        """単純指数平滑と同じ形で近似する

        Theta法の厳密な予測分散は ARIMA(0,1,1) + drift 表現から導かれるが、
        ここでは残差分散にもとづく SES 型の近似を用いる（やや保守的）。
        """
        steps = np.arange(1, h + 1, dtype=np.float64)
        return self._sigma2 * (1.0 + self.alpha**2 * (steps - 1.0))


class Naive(ForecastModel):
    """ナイーブ予測（ランダムウォーク）

    直近の実績をそのまま将来に延長する。平滑化を行わないぶん水準の急変に
    最も速く追従するため、事業の段階が変わったような系列で有利になる。
    予測コンペティションでも標準のベンチマークとして使われる。

    予測分散: σ²_h = σ²·h （ランダムウォークの誤差は時間に比例して蓄積する）
    """

    name = "ナイーブ"
    min_observations = 2
    burn_in = 1

    def __init__(self) -> None:
        super().__init__()
        self.level: float = 0.0

    def fit(self, y: FloatArray) -> Naive:
        self.level = float(y[-1])
        # 1期先予測は「前月の値」そのもの
        fitted = np.concatenate(([float(y[0])], y[:-1]))
        self._store_residuals(y, fitted, n_params=0)
        return self

    def forecast(self, h: int) -> FloatArray:
        return np.full(h, self.level, dtype=np.float64)

    def forecast_variance(self, h: int) -> FloatArray:
        return self._sigma2 * np.arange(1, h + 1, dtype=np.float64)


class Combination(ForecastModel):
    """3手法の単純平均（M2コンペティション優勝手法 COMB S-H-D と同系統）

    単純指数平滑・減衰トレンド・Theta法の予測を等加重で平均する。
    どのモデルが正しいか事前に決められない場合、平均は単体より安定しやすい。
    """

    name = "3手法平均"
    min_observations = 3
    burn_in = 2

    def __init__(self) -> None:
        super().__init__()
        self.members: list[ForecastModel] = []

    def fit(self, y: FloatArray) -> Combination:
        self.members = [
            SimpleExponentialSmoothing().fit(y),
            DampedHolt().fit(y),
            Theta().fit(y),
        ]
        fitted = np.mean([member.fitted for member in self.members], axis=0)
        self._store_residuals(y, fitted, n_params=2)
        return self

    def forecast(self, h: int) -> FloatArray:
        return np.mean([member.forecast(h) for member in self.members], axis=0)

    def forecast_variance(self, h: int) -> FloatArray:
        """構成モデルの予測分散の平均

        平均予測の真の分散は誤差相関に依存し通常はこれより小さくなるため、
        保守的（区間が広め＝信頼度が低め）に振れる近似である。
        """
        return np.mean([member.forecast_variance(h) for member in self.members], axis=0)
