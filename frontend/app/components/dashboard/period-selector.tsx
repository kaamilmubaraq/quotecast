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
import { ja } from "date-fns/locale";

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

  const handleRecentMonths = (months: number) => {
    onPeriodChange("recent", months);
  };

  const handleRangeApply = () => {
    if (startDate && endDate) {
      onPeriodChange("range", { start: startDate, end: endDate });
      setOpen(false);
    }
  };

  const isSelected = (months: number) => {
    return currentPeriodType === "recent" && currentRecentMonths === months;
  };

  const isCustomSelected = currentPeriodType === "range";

  return (
    <>
      <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
        <span className="px-2 text-sm text-slate-500">過去</span>

        <Button
          variant={isSelected(3) ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => handleRecentMonths(3)}
        >
          3ヶ月
        </Button>
        <Button
          variant={isSelected(6) ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => handleRecentMonths(6)}
        >
          6ヶ月
        </Button>
        <Button
          variant={isSelected(12) ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => handleRecentMonths(12)}
        >
          12ヶ月
        </Button>
        <Button
          variant={isSelected(24) ? "default" : "ghost"}
          size="sm"
          className="rounded-full"
          onClick={() => handleRecentMonths(24)}
        >
          24ヶ月
        </Button>
      </div>

      {/* カスタム期間は独立したグループとして末尾に配置する（予測ON時は非表示） */}
      {!hideCustom && (
        <div className="order-last flex items-center rounded-full bg-slate-100 p-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={isCustomSelected ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                カスタム
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[480px]" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">期間指定</Label>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2 min-w-[180px]">
                    <Label className="text-xs">開始月</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-sm h-10 bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {startDate
                              ? format(startDate, "yyyy年M月", { locale: ja })
                              : "選択"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="text-muted-foreground mt-7 text-lg">〜</div>

                  <div className="flex-1 space-y-2 min-w-[180px]">
                    <Label className="text-xs">終了月</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-sm h-10 bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {endDate
                              ? format(endDate, "yyyy年M月", { locale: ja })
                              : "選択"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          locale={ja}
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
                  適用
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );
}
