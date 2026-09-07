import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getGetEstimatesApiEstimatesGetQueryKey,
  useDeleteEstimateApiEstimatesEstimateIdDelete,
} from "@/gen/estimates/estimates";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  estimateId: string | null;
  onOpenChange: (isOpen: boolean) => void;
}

export const DeleteEstimateConfirmDialog = ({
  isOpen,
  estimateId,
  onOpenChange,
}: Props) => {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useDeleteEstimateApiEstimatesEstimateIdDelete();

  const handleDeleteConfirm = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (isPending) return;

    if (!estimateId) {
      toast.error("エラー", {
        description: "見積もりIDが見つかりません。",
      });
      return;
    }

    mutate(
      {
        estimateId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
          });
          onOpenChange(false);

          toast.success("見積もりが削除されました", {
            description: "見積もりの削除が正常に完了しました。",
          });
        },
        onError: () => {
          toast.error("エラー", {
            description: "見積もり削除に失敗しました。もう一度お試しください",
          });
        },
      },
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>見積書を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。見積書に関連するすべてのデータが削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
