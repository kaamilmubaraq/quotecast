import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/date-picker";
import type { EstimateFilters, EstimateStatus } from "@/lib/types";

// ステータスの選択肢（表示順）
const STATUS_OPTIONS: { value: EstimateStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "sent", label: "送付済み" },
  { value: "accepted", label: "受注" },
  { value: "rejected", label: "失注" },
  { value: "expired", label: "期限切れ" },
];

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
        <Button variant="outline" className="bg-white">
          <Filter className="w-4 h-4 mr-2" />
          フィルター
          {activeFilterCount > 0 && (
            <Badge className="ml-2 rounded-full px-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-4">
        {/* ステータス */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">ステータス</h4>
          {STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={filters.statuses.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleStatusToggle(option.value, checked === true)
                }
              />
              <Label
                htmlFor={`status-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {/* 発行日 */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">発行日</h4>
          <div className="flex items-center gap-2">
            <DatePicker
              key={`issue-from-${resetKey}`}
              date={filters.issueDateFrom}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, issueDateFrom: date })
              }
              placeholder="開始日"
            />
            <span className="text-slate-500">〜</span>
            <DatePicker
              key={`issue-to-${resetKey}`}
              date={filters.issueDateTo}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, issueDateTo: date })
              }
              placeholder="終了日"
            />
          </div>
        </div>

        {/* 有効期限 */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">有効期限</h4>
          <div className="flex items-center gap-2">
            <DatePicker
              key={`expiry-from-${resetKey}`}
              date={filters.expiryDateFrom}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, expiryDateFrom: date })
              }
              placeholder="開始日"
            />
            <span className="text-slate-500">〜</span>
            <DatePicker
              key={`expiry-to-${resetKey}`}
              date={filters.expiryDateTo}
              onDateChange={(date) =>
                onFiltersChange({ ...filters, expiryDateTo: date })
              }
              placeholder="終了日"
            />
          </div>
        </div>

        <div className="border-t pt-3">
          <Button variant="outline" className="w-full" onClick={handleClearAll}>
            すべてクリア
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
