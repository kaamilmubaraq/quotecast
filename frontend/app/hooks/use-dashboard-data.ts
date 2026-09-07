import { useState, useMemo } from "react";
import {
  useGetDashboardSummaryApiDashboardsSummaryGet,
  useGetDashboardTrendsApiDashboardsTrendsGet,
} from "@/gen/dashboards/dashboards";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useGetMonthlyForecastApiForecastsMonthlyGet } from "@/gen/forecasts/forecasts";

export interface MonthlyData {
  month: string;
  amount: number;
  count: number;
  isForecast?: boolean;
  confidence?: number;
  /** 95%予測区間の [下限, 上限]。実績月には無い */
  interval?: [number, number];
}

export function useDashboardData() {
  const [periodType, setPeriodType] = useState<"recent" | "range">("recent");
  const [recentMonths, setRecentMonths] = useState(6);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(
    null,
  );
  const [showForecast, setShowForecast] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState(3);

  // ダッシュボード集計取得
  const { data: summaryData, isLoading: summaryLoading } =
    useGetDashboardSummaryApiDashboardsSummaryGet();

  // 見積もり推移取得用の日付範囲を計算
  const { startDate, endDate } = useMemo(() => {
    if (periodType === "range" && dateRange) {
      return {
        startDate: format(startOfMonth(dateRange.start), "yyyy-MM-dd"),
        endDate: format(endOfMonth(dateRange.end), "yyyy-MM-dd"),
      };
    } else {
      // "recent"モードの場合、現在の月末と指定月数前の月初を計算
      const end = endOfMonth(new Date());
      const start = startOfMonth(subMonths(end, recentMonths - 1));
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      };
    }
  }, [periodType, recentMonths, dateRange]);

  const { data: trendsData, isLoading: trendsLoading } =
    useGetDashboardTrendsApiDashboardsTrendsGet({
      start_date: startDate,
      end_date: endDate,
    });

  // 需要予測取得（予測ONのときのみリクエストする）
  const { data: forecastData, isLoading: forecastLoading } =
    useGetMonthlyForecastApiForecastsMonthlyGet(
      { months_back: recentMonths, months_ahead: monthsAhead },
      { query: { enabled: showForecast } },
    );

  // API のグラフデータを変換
  const monthlyData: MonthlyData[] =
    trendsData?.graph_items?.map((item) => ({
      month: item.month,
      amount: item.amount,
      count: item.count,
    })) || [];

  // 予測ONのときは、予測の算出元となった実績データと予測データを1つの配列にまとめる
  const historicalPoints: MonthlyData[] =
    forecastData?.historical_data.map((item) => ({
      month: item.year_month,
      amount: item.actual_amount,
      count: item.actual_count,
      isForecast: false,
      confidence: item.confidence,
    })) ?? [];

  // 予測区間の帯が実績の最終月から立ち上がるよう、幅ゼロの区間を置いておく。
  // これが無いと帯が何もない所から斜めに現れる。
  const lastHistorical = historicalPoints.at(-1);
  if (lastHistorical) {
    lastHistorical.interval = [lastHistorical.amount, lastHistorical.amount];
  }

  const chartData: MonthlyData[] =
    showForecast && forecastData
      ? [
          ...historicalPoints,
          ...forecastData.predictions.map((item) => ({
            month: item.year_month,
            amount: item.predicted_amount,
            count: item.predicted_count,
            isForecast: true,
            confidence: item.confidence,
            interval: [item.lower_amount, item.upper_amount] as [number, number],
          })),
        ]
      : monthlyData;

  const handlePeriodChange = (
    type: "recent" | "range",
    value: number | { start: Date; end: Date },
  ) => {
    setPeriodType(type);
    if (type === "recent" && typeof value === "number") {
      setRecentMonths(value);
      setDateRange(null);
    } else if (type === "range" && typeof value !== "number") {
      setDateRange(value);
    }
  };

  const handleForecastToggle = () => {
    // 需要予測APIは相対月数のみを受け付けるため、
    // カスタム期間の選択中に予測をONにする場合は相対期間に戻す
    if (!showForecast && periodType === "range") {
      setPeriodType("recent");
      setDateRange(null);
    }
    setShowForecast((previous) => !previous);
  };

  const handleMonthsAheadChange = (months: number) => {
    setMonthsAhead(months);
  };

  return {
    // サマリーデータ
    totalCount: summaryData?.total_count || 0,
    currentMonthCount: summaryData?.current_month_count || 0,
    totalAmount: summaryData?.total_amount || 0,
    averageAmount: summaryData?.average_amount || 0,

    // グラフデータ
    chartData,

    // ローディング状態
    isLoading: summaryLoading || trendsLoading || forecastLoading,

    // 期間選択
    periodType,
    recentMonths,
    dateRange,
    handlePeriodChange,
    // 需要予測
    showForecast,
    monthsAhead,
    trendAnalysis: forecastData?.trend_analysis ?? "",
    selectedModel: forecastData?.selected_model ?? "",
    backtestMase: forecastData?.backtest_mase ?? null,
    handleForecastToggle,
    handleMonthsAheadChange,
  };
}
