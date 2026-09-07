import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Estimate } from "@/lib/types";

interface EstimateNotesProps {
  estimate: Estimate;
  onInputChange: (field: keyof Estimate, value: string) => void;
}

export function EstimateNotes({ estimate, onInputChange }: EstimateNotesProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">備考</h2>
      <Textarea
        value={estimate.remarks || ""}
        onChange={(e) => onInputChange("remarks", e.target.value)}
        placeholder="備考事項を入力"
        rows={4}
      />
    </Card>
  );
}
