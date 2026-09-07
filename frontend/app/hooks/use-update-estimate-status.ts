import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useUpdateEstimateApiEstimatesEstimateIdPut,
  getGetEstimatesApiEstimatesGetQueryKey,
  getGetEstimateApiEstimatesEstimateIdGetQueryKey,
} from "@/gen/estimates/estimates";

export function useUpdateEstimateStatus() {
  const queryClient = useQueryClient();

  const updateEstimateMutation = useUpdateEstimateApiEstimatesEstimateIdPut({
    mutation: {
      onSuccess: (_data, variables) => {
        // ステータス変更後に一覧と詳細を再取得
        queryClient.invalidateQueries({
          queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetEstimateApiEstimatesEstimateIdGetQueryKey(
            variables.estimateId,
          ),
        });
        toast.success("ステータスを変更しました");
      },
      onError: () => {
        toast.error("エラー", {
          description: "ステータスの変更に失敗しました。もう一度お試しください",
        });
      },
    },
  });

  return {
    updateStatus: (
      estimateId: string,
      newStatus: "draft" | "sent" | "accepted" | "rejected" | "expired",
    ) => {
      updateEstimateMutation.mutate({
        estimateId,
        data: { status: newStatus },
      });
    },
    isUpdating: updateEstimateMutation.isPending,
  };
}
