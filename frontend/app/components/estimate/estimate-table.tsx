import { differenceInCalendarDays, parseISO } from "date-fns";
import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateStatusMenu } from "@/components/estimate/estimate-status-menu";
import type { EstimateListItem } from "@/gen/schema";
import { useFormatters, useI18n } from "@/i18n";
import { statusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

const TAX_RATE = 1.1;

/** 期限が近いと判断する日数 */
const URGENT_DAYS = 3;
const SOON_DAYS = 7;

/** 発行日が無いときに、残り期間の割合を出すために使う既定の有効期間 */
const DEFAULT_VALIDITY_DAYS = 30;

interface EstimateTableProps {
  estimates: EstimateListItem[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

/**
 * 有効期限の残りを長さで見せる
 *
 * 日付を読んで引き算しなくても、バーの短さで「もう時間がない」と分かるようにする。
 */
function ValidityBar({
  issueDate,
  expiryDate,
}: {
  issueDate?: string;
  expiryDate: string;
}) {
  const { t } = useI18n();

  const expiry = parseISO(expiryDate);
  // 発行日が未設定の見積もりもあるため、その場合は既定の有効期間で割合を出す
  const totalDays = issueDate
    ? Math.max(differenceInCalendarDays(expiry, parseISO(issueDate)), 1)
    : DEFAULT_VALIDITY_DAYS;
  const remainingDays = differenceInCalendarDays(expiry, new Date());
  const ratio = Math.min(Math.max(remainingDays / totalDays, 0), 1);

  const isExpired = remainingDays < 0;
  const isUrgent = !isExpired && remainingDays <= URGENT_DAYS;
  const isSoon = !isExpired && !isUrgent && remainingDays <= SOON_DAYS;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs tabular">{expiryDate}</span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-1 w-16 overflow-hidden rounded-full bg-secondary"
        >
          <span
            className={cn(
              "block h-full rounded-full",
              isExpired && "bg-muted-foreground/40",
              isUrgent && "bg-status-rejected",
              isSoon && "bg-status-expired",
              !isExpired && !isUrgent && !isSoon && "bg-status-accepted",
            )}
            style={{ width: `${Math.max(ratio * 100, isExpired ? 100 : 3)}%` }}
          />
        </span>
        <span
          className={cn(
            "text-[11px] tabular",
            isUrgent || isExpired
              ? "font-medium text-status-rejected"
              : "text-muted-foreground",
          )}
        >
          {isExpired
            ? t("status.expired")
            : remainingDays === 0
              ? t("analytics.today")
              : t("analytics.daysRemaining", { n: remainingDays })}
        </span>
      </span>
    </div>
  );
}

export function EstimateTable({
  estimates,
  onDelete,
  onDuplicate,
  onStatusChange,
}: EstimateTableProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { currency } = useFormatters();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {[
              "estimates.column.number",
              "estimates.column.customer",
              "estimates.column.project",
              "estimates.column.status",
            ].map((key) => (
              <th
                key={key}
                scope="col"
                className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {t(key as Parameters<typeof t>[0])}
              </th>
            ))}
            <th
              scope="col"
              className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t("estimates.column.amount")}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t("estimates.column.validity")}
            </th>
            <th scope="col" className="w-10 px-3 py-2">
              <span className="sr-only">{t("action.duplicate")}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {estimates.map((estimate) => {
            const meta = statusMeta(estimate.status);
            const totalWithTax = Math.floor(
              (estimate.total_amount ?? 0) * TAX_RATE,
            );

            return (
              <tr
                key={estimate.id}
                onClick={() => navigate(`/estimates/${estimate.id}`)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors duration-150 hover:bg-secondary/50"
              >
                <td className="px-3 py-2.5 text-xs text-muted-foreground tabular">
                  {estimate.estimate_number}
                </td>
                <td className="max-w-40 truncate px-3 py-2.5">
                  {estimate.customer_name || "—"}
                </td>
                <td className="max-w-56 truncate px-3 py-2.5 font-medium">
                  {estimate.project_name}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium",
                      meta.badge,
                    )}
                  >
                    {t(meta.labelKey)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular">
                  {currency(totalWithTax)}
                </td>
                <td className="px-3 py-2.5">
                  <ValidityBar
                    issueDate={estimate.issue_date}
                    expiryDate={estimate.expiry_date}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={estimate.project_name}
                        onClick={(event) => event.stopPropagation()}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <MoreVertical className="size-4" strokeWidth={2} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <EstimateStatusMenu
                        currentStatus={estimate.status}
                        onStatusChange={(status) =>
                          onStatusChange(estimate.id, status)
                        }
                      />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          onDuplicate(estimate.id);
                        }}
                      >
                        <Copy className="mr-2 size-4" strokeWidth={2} />
                        {t("action.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(estimate.id);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" strokeWidth={2} />
                        {t("action.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
