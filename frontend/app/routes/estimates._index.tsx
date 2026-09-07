import { useState } from "react";
import { EstimateHeader, EstimateList } from "@/components/estimate";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/i18n";
import type { EstimateFilters } from "@/lib/types";

const INITIAL_FILTERS: EstimateFilters = {
  statuses: [],
  issueDateFrom: "",
  issueDateTo: "",
  expiryDateFrom: "",
  expiryDateTo: "",
};

export default function EstimatesPage() {
  const [filters, setFilters] = useState<EstimateFilters>(INITIAL_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  // 入力のたびに問い合わせないよう、検索語は落ち着いてから送る
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("estimates.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("estimates.description")}
        </p>
      </header>

      <EstimateHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <EstimateList searchQuery={debouncedSearch} filters={filters} />
    </div>
  );
}
