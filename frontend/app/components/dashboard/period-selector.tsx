import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [3, 6, 12, 24];

interface PeriodSelectorProps {
  currentPeriodType: "recent" | "range";
  currentRecentMonths: number;
  onPeriodChange: (
    type: "recent" | "range",
    value: number | { start: Date; end: Date },
  ) => void;
  hideCustom?: boolean;
}

export default function PeriodSelector({
  currentPeriodType,
  currentRecentMonths,
  onPeriodChange,
  hideCustom,
}: PeriodSelectorProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const { t, locale } = useI18n();
  const dateLocale = locale === "ja" ? ja : enUS;
  const monthFormat = locale === "ja" ? "yyyy年M月" : "MMM yyyy";

  const handleRangeApply = () => {
    if (startDate && endDate) {
      onPeriodChange("range", { start: startDate, end: endDate });
      setOpen(false);
    }
  };

  const isSelected = (months: number) =>
    currentPeriodType === "recent" && currentRecentMonths === months;

  return (
    <>
      <div
        role="group"
        aria-label={t("chart.monthsAhead")}
        className="flex h-8 items-center gap-0.5 rounded-md border border-input p-0.5"
      >
        {RANGE_OPTIONS.map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => onPeriodChange("recent", months)}
            aria-pressed={isSelected(months)}
            className={cn(
              "rounded-[4px] px-2 py-1 text-xs font-medium tabular transition-colors duration-150",
              isSelected(months)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("chart.months", { n: months })}
          </button>
        ))}
      </div>

      {/* カスタム期間は独立したグループとして末尾に配置する（予測ON時は非表示） */}
      {!hideCustom && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-pressed={currentPeriodType === "range"}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150",
                currentPeriodType === "range"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Settings2 className="size-3.5" strokeWidth={2} />
              {locale === "ja" ? "カスタム" : "Custom"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(28rem,calc(100vw-2rem))]" align="end">
            <div className="space-y-4">
              <Label className="text-sm font-semibold">
                {locale === "ja" ? "期間指定" : "Custom range"}
              </Label>

              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {locale === "ja" ? "開始月" : "From"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start bg-transparent text-left text-sm font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 shrink-0" />
                        <span className="truncate">
                          {startDate
                            ? format(startDate, monthFormat, {
                                locale: dateLocale,
                              })
                            : "—"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <span className="pb-2 text-muted-foreground">–</span>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {locale === "ja" ? "終了月" : "To"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start bg-transparent text-left text-sm font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 shrink-0" />
                        <span className="truncate">
                          {endDate
                            ? format(endDate, monthFormat, {
                                locale: dateLocale,
                              })
                            : "—"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={handleRangeApply}
                disabled={!startDate || !endDate}
                className="w-full"
                size="sm"
              >
                {locale === "ja" ? "適用" : "Apply"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
