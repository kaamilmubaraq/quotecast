import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { CreateEstimateDialog } from "@/components/estimate/create-estimate-dialog";
import { EstimateFilter } from "@/components/estimate/estimate-filter";
import { useI18n } from "@/i18n";
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
  const { t } = useI18n();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("estimates.searchPlaceholder")}
            aria-label={t("action.search")}
            className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-8 text-sm placeholder:text-muted-foreground focus-visible:border-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t("action.clear")}
              className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        <EstimateFilter filters={filters} onFiltersChange={onFiltersChange} />

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          {t("action.newEstimate")}
        </button>
      </div>

      <CreateEstimateDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};
