import { useGetAnalyticsSummaryApiAnalyticsSummaryGet } from "@/gen/analytics/analytics";

/** 営業分析サマリーを取得する */
export function useAnalytics(expiringWithinDays = 14) {
  const { data, isLoading, isError, refetch } =
    useGetAnalyticsSummaryApiAnalyticsSummaryGet({
      expiring_within_days: expiringWithinDays,
    });

  return {
    statusBreakdown: data?.status_breakdown ?? [],
    winRate: data?.win_rate ?? null,
    pipelineAmount: data?.pipeline_amount ?? 0,
    pipelineCount: data?.pipeline_count ?? 0,
    wonAmount: data?.won_amount ?? 0,
    averageDealSize: data?.average_deal_size ?? 0,
    topCustomers: data?.top_customers ?? [],
    expiringSoon: data?.expiring_soon ?? [],
    isLoading,
    isError,
    refetch,
  };
}
