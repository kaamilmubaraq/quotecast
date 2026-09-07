import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getGetEstimateApiEstimatesEstimateIdGetQueryKey,
  useGetEstimateApiEstimatesEstimateIdGet,
  useUpdateEstimateApiEstimatesEstimateIdPut,
} from "@/gen/estimates/estimates";
import type { EstimateRead } from "@/gen/schema";
import { dateFormat } from "@/lib/date";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface Props extends EstimateRead {
  onDelete?: (id: string) => void;
}

export const EstimateItem = ({ onDelete, ...estimate }: Props) => {
  const { id } = estimate;
  const queryClient = useQueryClient();
  const { data } = useGetEstimateApiEstimatesEstimateIdGet(id, {
    query: {
      initialData: () => {
        return {
          estimate,
        };
      },
    },
  });

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");

  const mutationTile = useUpdateEstimateApiEstimatesEstimateIdPut({
    mutation: {
      onSuccess: () => {
        setIsEditing(false);
        setEditProjectName("");
        queryClient.invalidateQueries({
          queryKey: getGetEstimateApiEstimatesEstimateIdGetQueryKey(id),
        });
        toast.success("件名を変更しました");
      },
      onError: () => {
        toast.error("エラー", {
          description: "件名の変更に失敗しました。もう一度お試しください",
        });
      },
    },
  });

  const handleCardClick = (estimateId: string) => {
    navigate(`/estimates/${estimateId}`);
  };

  const handleTitleEdit = (currentProjectName: string) => {
    setIsEditing(true);
    setEditProjectName(currentProjectName);
  };

  const handleTitleSave = () => {
    if (editProjectName) {
      mutationTile.mutate({
        estimateId: id,
        data: {
          project_name: editProjectName,
        },
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(estimate.id);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all relative group border-2 h-[300px]"
      onClick={() => handleCardClick(estimate.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          {isEditing && (
            <div
              className="flex-1 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
                placeholder="件名を入力"
              />
              <Button
                size="sm"
                onClick={handleTitleSave}
                disabled={mutationTile.isPending}
              >
                保存
              </Button>
            </div>
          )}
          {!isEditing && (
            <Fragment>
              <CardTitle className="text-balance text-lg line-clamp-2">
                {data?.estimate.project_name ?? "件名なし"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleEdit(data?.estimate.project_name ?? "");
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Fragment>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">見積番号:</span>
            <span className="font-medium">
              {data?.estimate.estimate_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">発行日:</span>
            <span className="font-medium">
              {data?.estimate.issue_date
                ? dateFormat(data.estimate.issue_date)
                : "-"}
            </span>
          </div>
          <div className="pt-2 text-xs">
            <span className="text-muted-foreground">顧客名: </span>
            <span className="font-medium text-foreground">
              {data?.estimate.customer_name}
            </span>
          </div>
          <div className="pt-2">
            {(data?.estimate.status === "accepted" ||
              data?.estimate.status === "sent") && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {data?.estimate.status === "accepted" ? "受注" : "送付済"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end absolute bottom-0 right-0 w-full">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 m-4"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

EstimateItem.Skeleton = function () {
  return (
    <Card className="p-6 h-[300px]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-3/4" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 mt-auto" />
      </div>
    </Card>
  );
};
