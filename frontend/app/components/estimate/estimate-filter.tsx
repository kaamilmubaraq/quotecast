import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/date-picker";
import { useI18n } from "@/i18n";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { EstimateFilters, EstimateStatus } from "@/lib/types";

const INITIAL_FILTERS: EstimateFilters = {
  statuses: [],
  issueDateFrom: "",
  issueDateTo: "",
  expiryDateFrom: "",
  expiryDateTo: "",
};

interface EstimateFilterProps {
  filters: EstimateFilters;
  onFiltersChange: (filters: EstimateFilters) => void;
}

export const EstimateFilter = ({
  filters,
  onFiltersChange,
}: EstimateFilterProps) => {
  // DatePickerは内部状態を持つため、クリア時にkeyを変更して再マウントする
  const [resetKey, setResetKey] = useState(0);
  const { t, locale } = useI18n();

  const activeFilterCount =
    (filters.statuses.length > 0 ? 1 : 0) +
    (filters.issueDateFrom || filters.issueDateTo ? 1 : 0) +
    (filters.expiryDateFrom || filters.expiryDateTo ? 1 : 0);

  const handleStatusToggle = (status: EstimateStatus, checked: boolean) => {
    onFiltersChange({
      ...filters,
      statuses: checked
        ? [...filters.statuses, status]
        : filters.statuses.filter((s) => s !== status),
    });
  };

  const handleClearAll = () => {
    onFiltersChange(INITIAL_FILTERS);
    setResetKey((prev) => prev + 1);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150",
            activeFilterCount > 0
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Filter className="size-3.5" strokeWidth={2} />
          {locale === "ja" ? "フィルター" : "Filter"}
          {activeFilterCount > 0 && (
            <span className="rounded bg-primary-foreground/20 px-1 tabular">
              {activeFilterCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-4">
        {/* ステータス */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">
            {t("estimates.column.status")}
          </legend>
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.statuses.includes(status)}
                onCheckedChange={(checked) =>
                  handleStatusToggle(status, checked === true)
                }
              />
              <Label
                htmlFor={`status-${status}`}
                className="text-sm font-normal"
              >
                {t(STATUS_META[status].labelKey)}
              </Label>
            </div>
          ))}
        </fieldset>

        {/* 発行日 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">
            {locale === "ja" ? "発行日" : "Issue date"}
          </h4>
          <div className="flex items-center gap-2">
            <DatePicker
              key={`issue-from-${resetKey}`}
              date={filters.issueDateFrom}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, issueDateFrom: date })
              }
              placeholder={locale === "ja" ? "開始日" : "From"}
            />
            <span className="text-muted-foreground">–</span>
            <DatePicker
              key={`issue-to-${resetKey}`}
              date={filters.issueDateTo}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, issueDateTo: date })
              }
              placeholder={locale === "ja" ? "終了日" : "To"}
            />
          </div>
        </div>

        {/* 有効期限 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">
            {t("estimates.column.validity")}
          </h4>
          <div className="flex items-center gap-2">
            <DatePicker
              key={`expiry-from-${resetKey}`}
              date={filters.expiryDateFrom}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, expiryDateFrom: date })
              }
              placeholder={locale === "ja" ? "開始日" : "From"}
            />
            <span className="text-muted-foreground">–</span>
            <DatePicker
              key={`expiry-to-${resetKey}`}
              date={filters.expiryDateTo}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, expiryDateTo: date })
              }
              placeholder={locale === "ja" ? "終了日" : "To"}
            />
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleClearAll}
            disabled={activeFilterCount === 0}
          >
            {t("action.clear")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
