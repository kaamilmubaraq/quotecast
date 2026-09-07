import { RefreshCw } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const STATUS_OPTIONS = [
  { value: "draft", label: "下書き" },
  { value: "sent", label: "送付済み" },
  { value: "accepted", label: "受注" },
  { value: "rejected", label: "失注" },
  { value: "expired", label: "期限切れ" },
] as const;

interface EstimateStatusMenuProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export const EstimateStatusMenu = ({
  currentStatus,
  onStatusChange,
}: EstimateStatusMenuProps) => {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <RefreshCw className="w-4 h-4 mr-2" />
        ステータス変更
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {STATUS_OPTIONS.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(status.value);
            }}
            disabled={currentStatus === status.value}
          >
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
