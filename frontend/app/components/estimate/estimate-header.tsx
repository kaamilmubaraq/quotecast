import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, BarChart3, Search } from "lucide-react";
import { CreateEstimateDialog } from "@/components/estimate/create-estimate-dialog";
import { EstimateFilter } from "@/components/estimate/estimate-filter";
import type { EstimateFilters } from "@/lib/types";

interface EstimateHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: EstimateFilters;
  onFiltersChange: (filters: EstimateFilters) => void;
}

export const EstimateHeader = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}: EstimateHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="プロジェクト名・顧客名で検索"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <EstimateFilter filters={filters} onFiltersChange={onFiltersChange} />
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              ダッシュボード
            </Link>
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="default"
            className="font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      <CreateEstimateDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};
