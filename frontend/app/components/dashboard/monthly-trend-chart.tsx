import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import PeriodSelector from "@/components/dashboard/period-selector";
import type { MonthlyData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";

interface ChartPayload extends MonthlyData {
  isForecast?: boolean;
  confidence?: number;
}

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
  onForecastToggle: () => void;
  onMonthsAheadChange: (months: number) => void;
}

export function MonthlyTrendChart({
  data,
  periodType,
  recentMonths,
  onPeriodChange,
  showForecast,
  monthsAhead,
  trendAnalysis,
  onForecastToggle,
  onMonthsAheadChange,
}: MonthlyTrendChartProps) {
  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              月別見積もり推移
            </CardTitle>
            <CardDescription>金額と件数の推移を可視化</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 予測ON/OFFトグル */}
            <Button
              size="sm"
              variant={showForecast ? "default" : "outline"}
              onClick={onForecastToggle}
              className={
                showForecast
                  ? "rounded-full bg-purple-600 hover:bg-purple-700"
                  : "rounded-full"
              }
            >
              <Sparkles className="w-4 h-4 mr-2" />
              予測 {showForecast ? "ON" : "OFF"}
            </Button>

            <PeriodSelector
              currentPeriodType={periodType}
              currentRecentMonths={recentMonths}
              onPeriodChange={onPeriodChange}
              hideCustom={showForecast}
            />

            {/* 予測期間の選択（予測ON時のみ表示） */}
            {showForecast && (
              <div className="flex items-center gap-1 rounded-full bg-purple-50 p-1">
                <span className="px-2 text-sm text-slate-500">未来</span>
                {[3, 6, 12].map((months) => (
                  <Button
                    key={months}
                    size="sm"
                    variant={monthsAhead === months ? "default" : "ghost"}
                    onClick={() => onMonthsAheadChange(months)}
                    className={
                      monthsAhead === months
                        ? "rounded-full bg-purple-600 hover:bg-purple-700"
                        : "rounded-full"
                    }
                  >
                    {months}ヶ月
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* トレンド分析 */}
        {showForecast && trendAnalysis && (
          <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-purple-700">
              <TrendingUp className="w-4 h-4" />
              トレンド分析:
            </div>
            <p className="mt-1 text-sm text-slate-700">{trendAnalysis}</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2} />
              </linearGradient>
              <pattern
                id="colorForecastStripes"
                patternUnits="userSpaceOnUse"
                width={8}
                height={8}
                patternTransform="rotate(45)"
              >
                <rect width={8} height={8} fill="#faf5ff" />
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={8}
                  stroke="#a855f7"
                  strokeWidth={2}
                />
              </pattern>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 14 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#64748b", fontSize: 14 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
              label={{
                value: "金額 (¥)",
                angle: -90,
                offset: -40,
                position: "insideLeft",
                style: { fill: "#64748b", fontSize: 16, fontWeight: 600 },
              }}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 14 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={{ stroke: "#cbd5e1" }}
              label={{
                value: "件数",
                angle: 90,
                position: "insideRight",
                style: { fill: "#64748b", fontSize: 16, fontWeight: 600 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                padding: "16px",
              }}
              labelStyle={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
                color: "#1e293b",
              }}
              itemStyle={{
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
              }}
              formatter={(
                value: number,
                name: string,
                props: { payload?: ChartPayload },
              ) => {
                const isForecast = props.payload?.isForecast;
                const confidence = props.payload?.confidence;
                const prefix = isForecast ? "予測 " : "";
                const suffix =
                  isForecast && confidence
                    ? ` (信頼度: ${(confidence * 100).toFixed(0)}%)`
                    : "";

                if (name === "amount")
                  return [
                    `${prefix}¥${value.toLocaleString()}${suffix}`,
                    "金額",
                  ];
                return [`${prefix}${value}件${suffix}`, "件数"];
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "amount" ? "見積もり金額" : "見積もり件数"
              }
              wrapperStyle={{
                paddingTop: "30px",
                fontSize: 14,
                fontWeight: 600,
              }}
              iconType="circle"
            />
            <Bar
              yAxisId="left"
              dataKey="amount"
              fill="url(#colorAmount)"
              radius={[12, 12, 0, 0]}
              name="amount"
              maxBarSize={80}
            >
              {data.map((item, index) => (
                <Cell
                  key={index}
                  fill={
                    item.isForecast
                      ? "url(#colorForecastStripes)"
                      : "url(#colorAmount)"
                  }
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="count"
              stroke={showForecast ? "#a855f7" : "#f97316"}
              strokeWidth={4}
              strokeDasharray={showForecast ? "6 6" : undefined}
              dot={{ r: 6, fill: "#f97316", strokeWidth: 3, stroke: "#fff" }}
              activeDot={{
                r: 8,
                fill: "#f97316",
                strokeWidth: 3,
                stroke: "#fff",
              }}
              name="count"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
