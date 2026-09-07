import { RefreshCw } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";

interface EstimateStatusMenuProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export const EstimateStatusMenu = ({
  currentStatus,
  onStatusChange,
}: EstimateStatusMenuProps) => {
  const { t, locale } = useI18n();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <RefreshCw className="mr-2 size-4" strokeWidth={2} />
        {locale === "ja" ? "ステータス変更" : "Change status"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {STATUS_ORDER.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={(event) => {
              event.stopPropagation();
              onStatusChange(status);
            }}
            disabled={currentStatus === status}
          >
            {/* 現在のステータスが一覧の中で分かるよう、色の点を添える */}
            <span
              aria-hidden
              className={cn(
                "mr-2 size-2 rounded-[2px]",
                STATUS_META[status].fill,
              )}
            />
            {t(STATUS_META[status].labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
