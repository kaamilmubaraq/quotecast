import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import {
  EstimateBasicInfo,
  EstimateItemsTable,
  EstimateNotes,
  EstimatePdfPreview,
  EstimateDetailSkeleton,
} from "@/components/estimate-detail";
import { useEstimateDetail } from "@/hooks/use-estimate-detail";

export default function EstimateDetailPage() {
  const {
    estimate,
    pdfUrl,
    pdfFilename,
    isLoading,
    form,
    categories,
    groups,
    setGroups,
    handleInputChange,
    handleItemChange,
    addItem,
    removeItem,
    reorderItems,
    handleSave,
  } = useEstimateDetail();

  if (isLoading || !estimate) {
    return <EstimateDetailSkeleton />;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <PageHeader
        title="見積もり詳細"
        description={estimate.project_name}
        showBackButton={true}
        backLink="/estimates"
      />

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            <div className="h-full overflow-hidden">
              <EstimatePdfPreview pdfUrl={pdfUrl} filename={pdfFilename} />
            </div>

            <div className="h-full overflow-y-auto space-y-4 pr-2">
              <EstimateBasicInfo
                estimate={estimate}
                form={form}
                onInputChange={handleInputChange}
              />

              <EstimateItemsTable
                estimate={estimate}
                categories={categories}
                groups={groups}
                onGroupsChange={setGroups}
                onItemChange={handleItemChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onReorderItems={reorderItems}
              />

              <EstimateNotes
                estimate={estimate}
                onInputChange={handleInputChange}
              />

              <Button onClick={handleSave} className="w-full" size="lg">
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
