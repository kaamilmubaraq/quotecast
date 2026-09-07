import type { EstimateStatus } from "@/gen/schema/estimateStatus";

// バックエンドAPIスキーマに合わせた型定義
export type { EstimateRead as Estimate } from "@/gen/schema/estimateRead";
export type { EstimateItemRead as EstimateItem } from "@/gen/schema/estimateItemRead";
export type { EstimateStatus } from "@/gen/schema/estimateStatus";

// カテゴリ情報の型定義（見積明細のグループ分け用）
export interface ItemCategory {
  id: string;
  name: string;
}

// 見積もり一覧のフィルター条件
export interface EstimateFilters {
  statuses: EstimateStatus[];
  issueDateFrom: string;
  issueDateTo: string;
  expiryDateFrom: string;
  expiryDateTo: string;
}
