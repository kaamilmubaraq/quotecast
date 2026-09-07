import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEstimates } from "@/hooks/use-estimates";
import type { CreateEstimateRequest } from "@/gen/schema";
import { toast } from "sonner";

interface CreateEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEstimateDialog({
  open,
  onOpenChange,
}: CreateEstimateDialogProps) {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const { createEstimate, isCreating } = useEstimates();

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error("プロジェクト名を入力してください");
      return;
    }

    // 見積もり番号はバックエンドで自動生成される
    const newEstimate: CreateEstimateRequest = {
      project_name: projectName.trim(),
    };

    createEstimate(
      { data: newEstimate },
      {
        onSuccess: (response) => {
          toast.success("見積もりを作成しました");
          onOpenChange(false);
          setProjectName("");
          navigate(`/estimates/${response.estimate.id}`);
        },
        onError: () => {
          toast.error("見積もりの作成に失敗しました");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規見積もり作成</DialogTitle>
          <DialogDescription>
            プロジェクト名を入力して作成してください
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">プロジェクト名</Label>
            <Input
              id="projectName"
              placeholder="例: Webサイト制作"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            キャンセル
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "作成中..." : "作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
