"""需要予測アルゴリズム

見積もりの月次実績（金額・件数）から今後の需要を予測する。

設計方針:
1. 系列ごとにモデルを選ぶ — 単純指数平滑 / 減衰トレンド / Theta法 / 3手法平均 を
   時系列交差検証（rolling origin）で比較し、その系列で実際に当たっていたものを使う。
2. パラメータは推定する — 平滑化係数は決め打ちせず残差平方和の最小化で求める。
3. 信頼度は残差から導く — 予測区間の幅を残差分散から計算し、0〜1に写像する。
   予測が先になるほど、また系列の変動が大きいほど自動的に低くなる。
4. 予測は決定的 — 同じ入力からは常に同じ結果が出る（乱数を含まない）。

季節性について:
月次データに季節調整を入れる場合、季節指数の推定には最低3周期（36ヶ月）が必要とされる
（M4コンペティションのベンチマーク実装が採用している基準）。本APIが遡れるのは最大24ヶ月で、
各月あたり2観測以下からの推定になるため、季節成分はノイズを増やすだけと判断し採用していない。
"""

from __future__ import annotations

import calendar
from datetime import date, datetime

import numpy as np
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel

from algorithm.evaluation import select_best_model
from algorithm.smoothing import FloatArray


class HistoricalDataPoint(BaseModel):
    """過去データの1ポイントを表すデータクラス"""

    year_month: str
    actual_amount: int = 0
    actual_count: int = 0


class PredictionResult(BaseModel):
    """予測結果を表すデータクラス

    lower_amount / upper_amount は95%予測区間の下限・上限。
    """

    year_month: str
    predicted_amount: int
    predicted_count: int
    confidence: float
    lower_amount: int
    upper_amount: int


class ForecastOutcome(BaseModel):
    """予測結果と、その予測を出したモデルの情報

    どのモデルがなぜ選ばれたかを画面に出せるようにするため、
    予測値と一緒にモデル名と交差検証スコアを返す。
    """

    predictions: list[PredictionResult]
    selected_model: str
    backtest_mase: float | None = None


class TrendAnalysisResult(BaseModel):
    """トレンド分析結果を表すデータクラス"""

    trend: str  # "上昇トレンド", "下降トレンド", "横ばい", "不明"
    volatility: str  # "高い", "低い", "不明"
    average_amount: float
    slope: float
    description: str


# 95%予測区間に対応する標準正規分布の分位点
Z_95 = 1.96

# 当月を実績として扱うために最低限必要な経過割合
# これを下回る場合、月全体への換算倍率が大きくなりすぎるため学習から除外する
MIN_ELAPSED_FRACTION = 0.33

# 回帰の傾きを「トレンドあり」と判定するt値の閾値（両側およそ90%水準）
TREND_T_THRESHOLD = 1.7

# 月平均に対してこの割合を下回る傾きは実質的に横ばいとみなす
# （浮動小数点誤差による見せかけのトレンドも排除する）
MIN_RELATIVE_SLOPE = 0.001

# 変動係数がこれを超えると変動性が「高い」
HIGH_VOLATILITY_CV = 0.3

INSUFFICIENT_DATA_MESSAGE = "データ不足のため、トレンド分析ができません。"

# 実績が足りずモデルを選べなかった場合に返すモデル名
INSUFFICIENT_MODEL_NAME = "データ不足"


class ForecastAlgorithm:
    """需要予測アルゴリズムクラス

    データベースに依存しない純粋な計算ロジックを提供する。
    """

    def __init__(
        self,
        min_confidence: float = 0.3,
        max_confidence: float = 0.95,
    ):
        """
        Args:
            min_confidence: 信頼度の下限
            max_confidence: 信頼度の上限（予測に100%はないため1.0未満に留める）
        """
        self.min_confidence = min_confidence
        self.max_confidence = max_confidence

    # =========================================================================
    # 前処理
    # =========================================================================

    def build_fitting_series(
        self, historical: list[HistoricalDataPoint], today: date | None = None
    ) -> list[HistoricalDataPoint]:
        """学習用の系列を組み立てる

        最新月が「進行中の当月」の場合、その実績は月末までの一部でしかないため
        そのまま使うと直近が落ち込んで見え、予測が下振れする。

        - 十分に日数が経過していれば月全体に換算する（例: 15日時点なら 31/15 倍）
        - 経過が浅い場合は換算倍率が大きくなりすぎるため、その月を学習から除外する

        Returns:
            学習に使う系列（入力は変更しない）
        """
        if not historical:
            return []

        today = today or date.today()
        latest = historical[-1]
        latest_month = datetime.strptime(latest.year_month, "%Y-%m").date()

        is_current_month = (latest_month.year, latest_month.month) == (today.year, today.month)
        if not is_current_month:
            return list(historical)

        days_in_month = calendar.monthrange(today.year, today.month)[1]
        elapsed_fraction = today.day / days_in_month
        if elapsed_fraction >= 1.0:
            return list(historical)

        if elapsed_fraction < MIN_ELAPSED_FRACTION:
            return list(historical[:-1])

        scale = 1.0 / elapsed_fraction
        return [
            *historical[:-1],
            HistoricalDataPoint(
                year_month=latest.year_month,
                actual_amount=int(latest.actual_amount * scale),
                actual_count=int(latest.actual_count * scale),
            ),
        ]

    # =========================================================================
    # 予測
    # =========================================================================

    def run(self, historical: list[HistoricalDataPoint], months_ahead: int) -> ForecastOutcome:
        """需要予測を実行し、予測値と採用モデルをまとめて返す

        金額と件数はそれぞれ独立にモデル選択を行う。
        両者は単価を通じて相関するが、実績から直接学習するほうが
        単価を仮定して掛け合わせるより誤差が小さいため。

        Args:
            historical: 過去データのリスト（昇順）
            months_ahead: 予測する月数
        """
        months = self._future_months(historical, months_ahead)
        fitting = self.build_fitting_series(historical)

        amounts = np.array([point.actual_amount for point in fitting], dtype=np.float64)
        counts = np.array([point.actual_count for point in fitting], dtype=np.float64)

        # 実績が無い（すべて0を含む）場合は予測できない
        if amounts.size < 2 or not np.any(amounts):
            return ForecastOutcome(
                predictions=[self._empty_prediction(month) for month in months],
                selected_model=INSUFFICIENT_MODEL_NAME,
                backtest_mase=None,
            )

        amount_selection = select_best_model(amounts, months_ahead)
        count_selection = select_best_model(counts, months_ahead)

        amount_forecast = self._non_negative(amount_selection.model.forecast(months_ahead))
        count_forecast = self._non_negative(count_selection.model.forecast(months_ahead))
        amount_sigma = np.sqrt(
            np.maximum(amount_selection.model.forecast_variance(months_ahead), 0)
        )

        margins = Z_95 * amount_sigma
        # 予測値が伸びる系列では区間の相対幅が縮み、遠い月ほど信頼度が高く見えることがある。
        # 「先の予測ほど確からしい」は解釈として誤りなので、累積最小値で単調化する。
        confidences = np.minimum.accumulate(
            [
                self._confidence(float(amount_forecast[index]), float(margins[index]))
                for index in range(months_ahead)
            ]
        )

        predictions: list[PredictionResult] = []
        for index, month in enumerate(months):
            point = float(amount_forecast[index])
            margin = float(margins[index])
            predictions.append(
                PredictionResult(
                    year_month=month,
                    predicted_amount=int(round(point)),
                    predicted_count=int(round(float(count_forecast[index]))),
                    confidence=float(confidences[index]),
                    lower_amount=int(round(max(0.0, point - margin))),
                    upper_amount=int(round(point + margin)),
                )
            )

        return ForecastOutcome(
            predictions=predictions,
            selected_model=amount_selection.name,
            backtest_mase=amount_selection.cv_error,
        )

    def generate_predictions(
        self, historical: list[HistoricalDataPoint], months_ahead: int
    ) -> list[PredictionResult]:
        """需要予測の予測値だけを返す（`run` の薄いラッパー）"""
        return self.run(historical, months_ahead).predictions

    # =========================================================================
    # トレンド分析
    # =========================================================================

    def analyze_trend(self, historical: list[HistoricalDataPoint]) -> TrendAnalysisResult:
        """トレンド分析を行う

        傾きの符号だけでなく統計的な有意性も見る。
        観測が少なく誤差が大きい場合、見かけの傾きは偶然でも生じるため、
        t値が閾値を超えたときにだけトレンドありと判定する。

        予測と同じ前処理済みの系列を使う。進行中の当月を生のまま含めると、
        月末までの一部しかない実績が回帰を下に引っ張り、
        「予測は上昇しているのにトレンドは横ばい」という食い違いが起きるため。
        """
        historical = self.build_fitting_series(historical)
        if len(historical) < 2:
            return TrendAnalysisResult(
                trend="不明",
                volatility="不明",
                average_amount=0,
                slope=0,
                description=INSUFFICIENT_DATA_MESSAGE,
            )

        amounts = np.array([point.actual_amount for point in historical], dtype=np.float64)
        time_index = np.arange(amounts.size, dtype=np.float64)

        coefficients = np.polyfit(time_index, amounts, 1)
        slope, intercept = float(coefficients[0]), float(coefficients[1])
        average_amount = float(np.mean(amounts))

        trend = self._classify_trend(time_index, amounts, slope, intercept, average_amount)

        standard_deviation = float(np.std(amounts))
        coefficient_of_variation = (
            standard_deviation / average_amount if average_amount > 0 else 0.0
        )
        volatility = "高い" if coefficient_of_variation > HIGH_VOLATILITY_CV else "低い"

        description = (
            f"{trend}が見られます。変動性は{volatility}です。月平均: ¥{int(average_amount):,}"
        )

        return TrendAnalysisResult(
            trend=trend,
            volatility=volatility,
            average_amount=average_amount,
            slope=slope,
            description=description,
        )

    # =========================================================================
    # 内部ヘルパー
    # =========================================================================

    @staticmethod
    def _classify_trend(
        time_index: FloatArray,
        amounts: FloatArray,
        slope: float,
        intercept: float,
        average_amount: float,
    ) -> str:
        """回帰の傾きからトレンドを分類する"""
        # 平均に対して無視できる大きさの傾きは、有意かどうかを問わず横ばい
        if abs(slope) <= max(average_amount, 1.0) * MIN_RELATIVE_SLOPE:
            return "横ばい"

        n = amounts.size
        if n < 3:
            # 2点では誤差を推定できないため、平均に対する大きさで判断する
            significant = abs(slope) > average_amount * 0.05
        else:
            residuals = amounts - (intercept + slope * time_index)
            residual_variance = float(np.sum(residuals**2)) / (n - 2)
            sum_squared_deviation = float(np.sum((time_index - np.mean(time_index)) ** 2))
            standard_error = np.sqrt(residual_variance / sum_squared_deviation)
            # 残差がほぼ0（完全な直線）なら傾きは有意とみなす
            significant = (
                abs(slope) / standard_error > TREND_T_THRESHOLD if standard_error > 0 else True
            )

        if not significant:
            return "横ばい"
        return "上昇トレンド" if slope > 0 else "下降トレンド"

    def _confidence(self, point: float, margin: float) -> float:
        """予測区間の相対的な幅を0〜1の信頼度に写像する

        区間の半幅が予測値と同じ大きさ（±100%）なら0.5になる。
        予測が先になるほど分散が増えるため、信頼度は自動的に逓減する。
        """
        relative_width = margin / max(abs(point), 1.0)
        confidence = 1.0 / (1.0 + relative_width)
        return round(min(self.max_confidence, max(self.min_confidence, confidence)), 2)

    def _empty_prediction(self, month: str) -> PredictionResult:
        """実績が無い場合の予測（0件・0円）"""
        return PredictionResult(
            year_month=month,
            predicted_amount=0,
            predicted_count=0,
            confidence=self.min_confidence,
            lower_amount=0,
            upper_amount=0,
        )

    @staticmethod
    def _non_negative(values: FloatArray) -> FloatArray:
        """需要は負にならないため0で打ち切る"""
        return np.maximum(values, 0.0)

    @staticmethod
    def _future_months(historical: list[HistoricalDataPoint], months_ahead: int) -> list[str]:
        """予測対象の年月ラベルを生成する

        実績の最終月の翌月から開始する（実績が無い場合は当月の翌月から）。
        """
        if historical:
            anchor = datetime.strptime(historical[-1].year_month, "%Y-%m").date()
        else:
            anchor = date.today().replace(day=1)
        return [
            (anchor + relativedelta(months=i)).strftime("%Y-%m")
            for i in range(1, months_ahead + 1)
        ]
