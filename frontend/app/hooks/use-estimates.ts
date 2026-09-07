import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEstimatesApiEstimatesGet,
  useCreateEstimateApiEstimatesPost,
  useDeleteEstimateApiEstimatesEstimateIdDelete,
  useDuplicateEstimateApiEstimatesEstimateIdDuplicatePost,
  getGetEstimatesApiEstimatesGetQueryKey,
} from "@/gen/estimates/estimates";
import { getGetAnalyticsSummaryApiAnalyticsSummaryGetQueryKey } from "@/gen/analytics/analytics";
import {
  getGetDashboardSummaryApiDashboardsSummaryGetQueryKey,
  getGetDashboardTrendsApiDashboardsTrendsGetQueryKey,
} from "@/gen/dashboards/dashboards";
import { getGetMonthlyForecastApiForecastsMonthlyGetQueryKey } from "@/gen/forecasts/forecasts";

export function useEstimates(search?: string) {
  const queryClient = useQueryClient();

  // 見積一覧取得（検索はサーバー側で絞り込む）
  const trimmed = search?.trim();
  const { data, isLoading, error } = useGetEstimatesApiEstimatesGet(
    trimmed ? { search: trimmed } : undefined,
  );

  /** 見積もりデータに依存する集計をまとめて無効化する */
  const invalidateDerivedQueries = () => {
    queryClient.invalidateQueries({
      queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryApiDashboardsSummaryGetQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getGetDashboardTrendsApiDashboardsTrendsGetQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getGetMonthlyForecastApiForecastsMonthlyGetQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getGetAnalyticsSummaryApiAnalyticsSummaryGetQueryKey(),
    });
  };

  // 見積作成
  const createMutation = useCreateEstimateApiEstimatesPost({
    mutation: {
      onSuccess: invalidateDerivedQueries,
    },
  });

  // 見積削除
  const deleteMutation = useDeleteEstimateApiEstimatesEstimateIdDelete({
    mutation: {
      onSuccess: invalidateDerivedQueries,
    },
  });

  // 見積複製
  const duplicateMutation =
    useDuplicateEstimateApiEstimatesEstimateIdDuplicatePost({
      mutation: { onSuccess: invalidateDerivedQueries },
    });

  return {
    estimates: data?.estimates ?? [],
    isLoading,
    error,
    createEstimate: createMutation.mutate,
    deleteEstimate: (estimateId: string) =>
      deleteMutation.mutate({ estimateId }),
    duplicateEstimate: (
      estimateId: string,
      options?: { onSuccess?: () => void; onError?: () => void },
    ) => duplicateMutation.mutate({ estimateId }, options),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
}
