import { useState } from "react";
import { FileText } from "lucide-react";
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
import { EstimateTable } from "@/components/estimate/estimate-table";
import { useEstimates } from "@/hooks/use-estimates";
import { useUpdateEstimateStatus } from "@/hooks/use-update-estimate-status";
import { useI18n } from "@/i18n";
import type { EstimateFilters, EstimateStatus } from "@/lib/types";
import { toast } from "sonner";

interface EstimateListProps {
  /** サーバー側で絞り込む検索語 */
  searchQuery: string;
  filters: EstimateFilters;
}

export const EstimateList = ({ searchQuery, filters }: EstimateListProps) => {
  const { estimates, isLoading, deleteEstimate, duplicateEstimate } =
    useEstimates(searchQuery);
  const { updateStatus } = useUpdateEstimateStatus();
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);
  const { t } = useI18n();

  // 検索はサーバー側。ステータスと日付はクライアント側で絞り込む
  const filteredEstimates = estimates.filter((estimate) => {
    const matchesStatus =
      filters.statuses.length === 0 ||
      filters.statuses.includes(estimate.status);

    const issueDate = estimate.issue_date;
    const matchesIssueDate =
      (!filters.issueDateFrom ||
        (!!issueDate && issueDate >= filters.issueDateFrom)) &&
      (!filters.issueDateTo ||
        (!!issueDate && issueDate <= filters.issueDateTo));

    const matchesExpiryDate =
      (!filters.expiryDateFrom ||
        estimate.expiry_date >= filters.expiryDateFrom) &&
      (!filters.expiryDateTo || estimate.expiry_date <= filters.expiryDateTo);

    return matchesStatus && matchesIssueDate && matchesExpiryDate;
  });

  const handleDeleteConfirm = () => {
    if (estimateToDelete) {
      deleteEstimate(estimateToDelete);
      toast.success(t("estimates.deleted"));
      setEstimateToDelete(null);
    }
  };

  const handleDuplicate = (estimateId: string) => {
    duplicateEstimate(estimateId, {
      onSuccess: () => toast.success(t("estimates.duplicated")),
      onError: () => toast.error(t("estimates.duplicateFailed")),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-px overflow-hidden rounded-lg border border-border">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse bg-card" />
        ))}
      </div>
    );
  }

  if (filteredEstimates.length === 0) {
    const isFiltered = searchQuery.trim() !== "" || filters.statuses.length > 0;

    return (
      <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
        <FileText
          className="mx-auto size-8 text-muted-foreground/50"
          strokeWidth={1.5}
        />
        <h2 className="mt-3 text-sm font-medium">
          {isFiltered ? t("estimates.noMatch") : t("estimates.empty")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFiltered ? t("estimates.noMatchHint") : t("estimates.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <>
      <EstimateTable
        estimates={filteredEstimates}
        onDelete={setEstimateToDelete}
        onDuplicate={handleDuplicate}
        onStatusChange={(id, status) =>
          updateStatus(id, status as EstimateStatus)
        }
      />

      <AlertDialog
        open={estimateToDelete !== null}
        onOpenChange={(open) => !open && setEstimateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("estimates.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("estimates.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60 dark:hover:bg-destructive/70"
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
