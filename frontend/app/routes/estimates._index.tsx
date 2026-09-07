import { useState } from "react";
import { EstimateHeader, EstimateList } from "@/components/estimate";
import PageHeader from "@/components/page-header";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="見積もり一覧"
        description="作成された見積もりの管理"
        showSystemIcon={true}
      />

      <div className="container mx-auto px-4 py-8">
        <EstimateHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <EstimateList searchQuery={searchQuery} filters={filters} />
      </div>
    </div>
  );
}
