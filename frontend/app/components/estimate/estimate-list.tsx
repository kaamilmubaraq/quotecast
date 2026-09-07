import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreVertical, Trash2 } from "lucide-react";
import { useEstimates } from "@/hooks/use-estimates";
import { useUpdateEstimateStatus } from "@/hooks/use-update-estimate-status";
import { toast } from "sonner";
import { EstimateStatusMenu } from "./estimate-status-menu";
import type { EstimateFilters } from "@/lib/types";

interface EstimateListProps {
  searchQuery: string;
  filters: EstimateFilters;
}

export const EstimateList = ({ searchQuery, filters }: EstimateListProps) => {
  const navigate = useNavigate();
  const { estimates, isLoading, deleteEstimate } = useEstimates();
  const { updateStatus } = useUpdateEstimateStatus();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);

  const filteredEstimates = estimates.filter((estimate) => {
    // 検索クエリフィルター
    const matchesSearch =
      searchQuery.trim() === "" ||
      estimate.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // ステータスフィルター
    const matchesStatus =
      filters.statuses.length === 0 ||
      filters.statuses.includes(estimate.status);

    // 発行日フィルター（発行日が未設定の場合は範囲指定時に除外する）
    const issueDate = estimate.issue_date;
    const matchesIssueDate =
      (!filters.issueDateFrom ||
        (!!issueDate && issueDate >= filters.issueDateFrom)) &&
      (!filters.issueDateTo ||
        (!!issueDate && issueDate <= filters.issueDateTo));

    // 有効期限フィルター
    const matchesExpiryDate =
      (!filters.expiryDateFrom ||
        estimate.expiry_date >= filters.expiryDateFrom) &&
      (!filters.expiryDateTo || estimate.expiry_date <= filters.expiryDateTo);

    return (
      matchesSearch && matchesStatus && matchesIssueDate && matchesExpiryDate
    );
  });

  const handleDeleteClick = (id: string) => {
    setEstimateToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (estimateToDelete) {
      deleteEstimate(estimateToDelete);
      toast.success("見積もりを削除しました");
      setEstimateToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleStatusChange = (estimateId: string, newStatus: string) => {
    updateStatus(
      estimateId,
      newStatus as "draft" | "sent" | "accepted" | "rejected" | "expired",
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { label: "下書き", variant: "secondary" },
      sent: { label: "送付済み", variant: "default" },
      accepted: { label: "受注", variant: "default" },
      rejected: { label: "失注", variant: "destructive" },
      expired: { label: "期限切れ", variant: "outline" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  if (filteredEstimates.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">
          {estimates.length > 0
            ? "該当する見積もりが見つかりません"
            : "見積もりがありません"}
        </h2>
        <p className="text-slate-500 mb-6">
          {estimates.length > 0
            ? "検索条件を変更してください"
            : "新しい見積もりを作成して始めましょう"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEstimates.map((estimate) => {
          const totalWithTax = Math.floor((estimate.total_amount ?? 0) * 1.1);
          return (
            <Card
              key={estimate.id}
              className="hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => navigate(`/estimates/${estimate.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {estimate.project_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {estimate.customer_name || "顧客未設定"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EstimateStatusMenu
                        currentStatus={estimate.status}
                        onStatusChange={(status) =>
                          handleStatusChange(estimate.id, status)
                        }
                      />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(estimate.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(estimate.status)}
                  <span className="text-xs text-slate-500">
                    {estimate.estimate_number}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">発行日:</span>
                    <span className="font-medium">{estimate.issue_date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">有効期限:</span>
                    <span className="font-medium">{estimate.expiry_date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">担当者:</span>
                    <span className="font-medium">
                      {estimate.in_charge_name || "未設定"}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-slate-600">金額:</span>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          ¥{totalWithTax.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">(税込)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>見積もりを削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。見積もりが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
