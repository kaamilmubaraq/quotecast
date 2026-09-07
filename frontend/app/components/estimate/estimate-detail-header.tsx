import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEstimateApiEstimatesEstimateIdGet } from "@/gen/estimates/estimates";
import { useRequiredParams } from "@/hooks/use-required-params";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export const EstimateDetailHeader = () => {
  const navigate = useNavigate();
  const { estimateId } = useRequiredParams<{ estimateId: string }>();
  const { data, isLoading } = useGetEstimateApiEstimatesEstimateIdGet(
    estimateId,
    {
      query: {
        select: (data) => {
          return {
            title: data.estimate.project_name,
          };
        },
      },
    },
  );

  if (isLoading) return <HeaderSkeleton />;

  return (
    <div className="border-b">
      <div className="container mx-auto py-4 px-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{data?.title ?? "-"}</h1>
        </div>
      </div>
    </div>
  );
};

const HeaderSkeleton = () => {
  return (
    <div className="border-b">
      <div className="container mx-auto py-4 px-4 flex items-center gap-4">
        <ArrowLeft className="h-5 w-5" />
        <div className="space-y-1">
          <Skeleton className="w-[250px] h-7" />
          <Skeleton className="w-[240px] h-5" />
        </div>
      </div>
    </div>
  );
};
