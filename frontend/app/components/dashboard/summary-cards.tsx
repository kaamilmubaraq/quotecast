import { useFormatters, useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/dictionary";

interface SummaryCardsProps {
  totalCount: number;
  currentMonthCount: number;
  totalAmount: number;
  averageAmount: number;
}

interface Tile {
  labelKey: TranslationKey;
  value: string;
}

/**
 * 主要指標のタイル
 *
 * 数字を主役にするため、ラベルは小さく上に置き、値は等幅数字で揃える。
 * 桁の違う金額が縦に並んでも視線が滑らないようにするのが狙い。
 */
export function SummaryCards({
  totalCount,
  currentMonthCount,
  totalAmount,
  averageAmount,
}: SummaryCardsProps) {
  const { t } = useI18n();
  const { currency, number } = useFormatters();

  const tiles: Tile[] = [
    { labelKey: "dashboard.totalCount", value: number(totalCount) },
    {
      labelKey: "dashboard.currentMonthCount",
      value: number(currentMonthCount),
    },
    { labelKey: "dashboard.totalAmount", value: currency(totalAmount) },
    { labelKey: "dashboard.averageAmount", value: currency(averageAmount) },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      {tiles.map(({ labelKey, value }) => (
        <div key={labelKey} className="bg-card px-4 py-3.5">
          <div className="text-xs text-muted-foreground">{t(labelKey)}</div>
          <div className="mt-1 truncate text-xl font-semibold tracking-tight tabular">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
