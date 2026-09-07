import {
  AnalyticsSection,
  MonthlyTrendChart,
  SummaryCards,
} from "@/components/dashboard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useI18n } from "@/i18n";

export default function DashboardPage() {
  const {
    totalCount,
    currentMonthCount,
    chartData,
    totalAmount,
    averageAmount,
    periodType,
    recentMonths,
    showForecast,
    monthsAhead,
    trendAnalysis,
    selectedModel,
    backtestMase,
    handleForecastToggle,
    handleMonthsAheadChange,
    handlePeriodChange,
  } = useDashboardData();
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </header>

      <div className="space-y-4">
        <SummaryCards
          totalCount={totalCount}
          currentMonthCount={currentMonthCount}
          totalAmount={totalAmount}
          averageAmount={averageAmount}
        />

        <MonthlyTrendChart
          data={chartData}
          periodType={periodType}
          recentMonths={recentMonths}
          onPeriodChange={handlePeriodChange}
          showForecast={showForecast}
          monthsAhead={monthsAhead}
          trendAnalysis={trendAnalysis}
          selectedModel={selectedModel}
          backtestMase={backtestMase}
          onForecastToggle={handleForecastToggle}
          onMonthsAheadChange={handleMonthsAheadChange}
        />

        <section className="pt-2">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">
            {t("analytics.title")}
          </h2>
          <AnalyticsSection />
        </section>
      </div>
    </div>
  );
}
