import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEstimatesApiEstimatesGet,
  useCreateEstimateApiEstimatesPost,
  useDeleteEstimateApiEstimatesEstimateIdDelete,
  getGetEstimatesApiEstimatesGetQueryKey,
} from "@/gen/estimates/estimates";
import {
  getGetDashboardSummaryApiDashboardsSummaryGetQueryKey,
  getGetDashboardTrendsApiDashboardsTrendsGetQueryKey,
} from "@/gen/dashboards/dashboards";
import { getGetMonthlyForecastApiForecastsMonthlyGetQueryKey } from "@/gen/forecasts/forecasts";

export function useEstimates() {
  const queryClient = useQueryClient();

  // 見積一覧取得
  const { data, isLoading, error } = useGetEstimatesApiEstimatesGet();

  // 見積作成
  const createMutation = useCreateEstimateApiEstimatesPost({
    mutation: {
      onSuccess: () => {
        // 作成成功後に一覧を再取得
        queryClient.invalidateQueries({
          queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
        });
        // ダッシュボードの集計値も見積もりデータに依存するため再取得
        queryClient.invalidateQueries({
          queryKey: getGetDashboardSummaryApiDashboardsSummaryGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTrendsApiDashboardsTrendsGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetMonthlyForecastApiForecastsMonthlyGetQueryKey(),
        });
      },
    },
  });

  // 見積削除
  const deleteMutation = useDeleteEstimateApiEstimatesEstimateIdDelete({
    mutation: {
      onSuccess: () => {
        // 削除成功後に一覧を再取得
        queryClient.invalidateQueries({
          queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
        });
        // ダッシュボードの集計値も見積もりデータに依存するため再取得
        queryClient.invalidateQueries({
          queryKey: getGetDashboardSummaryApiDashboardsSummaryGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTrendsApiDashboardsTrendsGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetMonthlyForecastApiForecastsMonthlyGetQueryKey(),
        });
      },
    },
  });

  return {
    estimates: data?.estimates ?? [],
    isLoading,
    error,
    createEstimate: createMutation.mutate,
    deleteEstimate: (estimateId: string) =>
      deleteMutation.mutate({ estimateId }),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
