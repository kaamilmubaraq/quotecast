import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartSpline, TrendingUp } from "lucide-react";
import PeriodSelector from "@/components/dashboard/period-selector";
import type { MonthlyData } from "@/hooks/use-dashboard-data";
import { useFormatters, useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface MonthlyTrendChartProps {
  data: MonthlyData[];
  periodType: "recent" | "range";
  recentMonths: number;
  onPeriodChange: (
    type: "recent" | "range",
    value: number | { start: Date; end: Date },
  ) => void;
  showForecast?: boolean;
  monthsAhead: number;
  trendAnalysis: string;
  selectedModel: string;
  backtestMase: number | null;
  onForecastToggle: () => void;
  onMonthsAheadChange: (months: number) => void;
}

interface TooltipEntry {
  payload: MonthlyData;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  const { t } = useI18n();
  const { currency, number, percent } = useFormatters();

  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-44 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg shadow-black/5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tabular">{label}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            point.isForecast
              ? "bg-status-sent-surface text-status-sent"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {point.isForecast ? t("chart.forecast") : t("chart.actual")}
        </span>
      </div>

      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex items-baseline justify-between gap-6">
          <dt className="text-muted-foreground">{t("chart.amount")}</dt>
          <dd className="font-medium tabular">{currency(point.amount)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-6">
          <dt className="text-muted-foreground">{t("chart.count")}</dt>
          <dd className="font-medium tabular">{number(point.count)}</dd>
        </div>
        {point.interval && (
          <div className="flex items-baseline justify-between gap-6 border-t border-border pt-1">
            <dt className="text-muted-foreground">{t("chart.interval")}</dt>
            <dd className="tabular text-muted-foreground">
              {currency(point.interval[0])} – {currency(point.interval[1])}
            </dd>
          </div>
        )}
        {point.isForecast && point.confidence !== undefined && (
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-muted-foreground">{t("chart.confidence")}</dt>
            <dd className="font-medium tabular">{percent(point.confidence)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function ChartLegend({ showForecast }: { showForecast: boolean }) {
  const { t } = useI18n();

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2.5 rounded-[2px] bg-chart-actual"
        />
        {t("chart.actual")}
      </li>
      {showForecast && (
        <>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px] border border-chart-forecast bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,var(--chart-forecast)_2px,var(--chart-forecast)_3px)]"
            />
            {t("chart.forecast")}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-4 rounded-[2px]"
              style={{ background: "var(--chart-band)" }}
            />
            {t("chart.interval")}
          </li>
        </>
      )}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-0.5 w-4 rounded-full bg-chart-count" />
        {t("chart.count")}
      </li>
    </ul>
  );
}

/** 予測を出したモデルとその成績。数字の出どころを画面に残す */
function ForecastAttribution({
  selectedModel,
  backtestMase,
  trendAnalysis,
}: {
  selectedModel: string;
  backtestMase: number | null;
  trendAnalysis: string;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-5 grid gap-3 rounded-md border border-border bg-secondary/40 p-3 sm:grid-cols-[auto_auto_1fr] sm:items-center sm:gap-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("forecast.model")}
        </div>
        <div className="mt-0.5 text-sm font-medium">{selectedModel || "—"}</div>
      </div>

      {backtestMase !== null && (
        <div title={t("forecast.maseHint")}>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("forecast.accuracy")}
          </div>
          <div className="mt-0.5 text-sm font-medium tabular">
            {t("forecast.mase", { value: backtestMase.toFixed(2) })}
          </div>
        </div>
      )}

      {trendAnalysis && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground sm:justify-self-end sm:text-right">
          <TrendingUp className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
          {trendAnalysis}
        </p>
      )}
    </div>
  );
}

export function MonthlyTrendChart({
  data,
  periodType,
  recentMonths,
  onPeriodChange,
  showForecast = false,
  monthsAhead,
  trendAnalysis,
  selectedModel,
  backtestMase,
  onForecastToggle,
  onMonthsAheadChange,
}: MonthlyTrendChartProps) {
  const { t } = useI18n();
  const { compactCurrency, number } = useFormatters();

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {t("chart.title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("chart.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onForecastToggle}
            aria-pressed={showForecast}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150",
              showForecast
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <ChartSpline className="size-3.5" strokeWidth={2} />
            {showForecast ? t("chart.forecastOff") : t("chart.forecastOn")}
          </button>

          <PeriodSelector
            currentPeriodType={periodType}
            currentRecentMonths={recentMonths}
            onPeriodChange={onPeriodChange}
            hideCustom={showForecast}
          />

          {showForecast && (
            <div
              role="group"
              aria-label={t("chart.monthsAhead")}
              className="flex h-8 items-center gap-0.5 rounded-md border border-input p-0.5"
            >
              {[3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => onMonthsAheadChange(months)}
                  aria-pressed={monthsAhead === months}
                  className={cn(
                    "rounded-[4px] px-2 py-1 text-xs font-medium tabular transition-colors duration-150",
                    monthsAhead === months
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("chart.months", { n: months })}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {showForecast && (
          <ForecastAttribution
            selectedModel={selectedModel}
            backtestMase={backtestMase}
            trendAnalysis={trendAnalysis}
          />
        )}

        {data.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            {t("chart.empty")}
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  {/* 予測の棒はハッチで塗る。色だけでなく質感でも実績と区別する */}
                  <pattern
                    id="forecastHatch"
                    patternUnits="userSpaceOnUse"
                    width={6}
                    height={6}
                    patternTransform="rotate(45)"
                  >
                    <rect
                      width={6}
                      height={6}
                      fill="var(--chart-band)"
                    />
                    <line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={6}
                      stroke="var(--chart-forecast)"
                      strokeWidth={2.5}
                    />
                  </pattern>
                </defs>

                <CartesianGrid
                  stroke="var(--chart-grid)"
                  strokeDasharray="2 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--chart-grid)" }}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(value: number) => compactCurrency(value)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(value: number) => number(value)}
                />

                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--chart-band)" }}
                />

                {/* 95%予測区間。実績月は interval を持たないので予測側だけに帯が出る */}
                {showForecast && (
                  <Area
                    yAxisId="left"
                    dataKey="interval"
                    stroke="none"
                    fill="var(--chart-band)"
                    isAnimationActive={false}
                    connectNulls={false}
                    activeDot={false}
                  />
                )}

                <Bar
                  yAxisId="left"
                  dataKey="amount"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={false}
                >
                  {data.map((item) => (
                    <Cell
                      key={item.month}
                      fill={
                        item.isForecast
                          ? "url(#forecastHatch)"
                          : "var(--chart-actual)"
                      }
                      stroke={
                        item.isForecast ? "var(--chart-forecast)" : "none"
                      }
                      strokeWidth={item.isForecast ? 1 : 0}
                    />
                  ))}
                </Bar>

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--chart-count)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ r: 2.5, fill: "var(--chart-count)", strokeWidth: 0 }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="mt-3 border-t border-border pt-3">
              <ChartLegend showForecast={showForecast} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
