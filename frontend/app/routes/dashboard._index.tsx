import PageHeader from "@/components/page-header";
import { SummaryCards, MonthlyTrendChart } from "@/components/dashboard";
import { useDashboardData } from "@/hooks/use-dashboard-data";

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
    handleForecastToggle,
    handleMonthsAheadChange,
    handlePeriodChange,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <PageHeader
        title="ダッシュボード"
        description="見積もりの統計と分析"
        showBackButton={true}
        backLink="/estimates"
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
          onForecastToggle={handleForecastToggle}
          onMonthsAheadChange={handleMonthsAheadChange}
        />
      </div>
    </div>
  );
}
