import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetEstimateApiEstimatesEstimateIdGet,
  useUpdateEstimateApiEstimatesEstimateIdPut,
  getGetEstimatesApiEstimatesGetQueryKey,
  getGetEstimateApiEstimatesEstimateIdGetQueryKey,
} from "@/gen/estimates/estimates";
import type { Estimate, EstimateItem } from "@/lib/types";
import type { UpdateEstimateRequest } from "@/gen/schema";
import { toast } from "sonner";
import { useItemCategories } from "./use-item-categories";
import { pdf } from "@react-pdf/renderer";
import { EstimatePDFDocument } from "@/components/pdf/pdf-document";
import { useDebouncedValue } from "./use-debounced-value";
import {
  getGetDashboardSummaryApiDashboardsSummaryGetQueryKey,
  getGetDashboardTrendsApiDashboardsTrendsGetQueryKey,
} from "@/gen/dashboards/dashboards";
import { getGetMonthlyForecastApiForecastsMonthlyGetQueryKey } from "@/gen/forecasts/forecasts";

// バリデーションスキーマ: 基本情報の入力チェック
const basicInfoSchema = z.object({
  project_name: z.string().min(1, "プロジェクト名を入力してください"),
  estimate_number: z.string(),
  issue_date: z.string().min(1, "発行日を選択してください"),
  expiry_date: z.string().min(1, "有効期限を選択してください"),
  customer_name: z.string().optional(),
  in_charge_name: z.string().optional(),
});

export function useEstimateDetail() {
  const navigate = useNavigate();
  const { estimateId } = useParams<{ estimateId: string }>();
  const queryClient = useQueryClient();
  const { categories, addCategory, updateCategory, removeCategory } =
    useItemCategories();

  // 見積詳細取得
  const { data, isLoading, error } = useGetEstimateApiEstimatesEstimateIdGet(
    estimateId!,
    {
      query: {
        enabled: !!estimateId,
      },
    },
  );

  // 見積更新
  const updateMutation = useUpdateEstimateApiEstimatesEstimateIdPut({
    mutation: {
      onSuccess: () => {
        // 更新成功後にキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: getGetEstimatesApiEstimatesGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetEstimateApiEstimatesEstimateIdGetQueryKey(estimateId),
        });
        // ダッシュボードの集計値も見積もりデータに依存するため再取得
        queryClient.invalidateQueries({
          queryKey: getGetDashboardSummaryApiDashboardsSummaryGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTrendsApiDashboardsTrendsGetQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetMonthlyForecastApiForecastsMonthlyGetQueryKey(),
        });
        toast.success("見積もりを保存しました");
      },
      onError: (error) => {
        toast.error("保存に失敗しました");
        console.error(error);
      },
    },
  });

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const debouncedEstimate = useDebouncedValue(estimate, 500);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfFilename, setPdfFilename] = useState<string>("");

  // React Hook Formの初期化
  const form = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      project_name: "",
      estimate_number: "",
      issue_date: "",
      expiry_date: "",
      customer_name: "",
      in_charge_name: "",
    },
  });

  // APIから取得したデータをローカルステートとフォームにセット
  useEffect(() => {
    if (data?.estimate) {
      setEstimate(data.estimate);
      // フォームの値を更新
      form.reset({
        project_name: data.estimate.project_name,
        estimate_number: data.estimate.estimate_number,
        issue_date: data.estimate.issue_date,
        expiry_date: data.estimate.expiry_date,
        customer_name: data.estimate.customer_name || "",
        in_charge_name: data.estimate.in_charge_name || "",
      });
    }
  }, [data, form]);

  // 見積が存在しない場合は一覧に戻る
  useEffect(() => {
    if (!isLoading && error) {
      toast.error("見積もりが見つかりません");
      navigate("/estimates");
    }
  }, [isLoading, error, navigate]);

  // PDF生成関数: 引数でestimateを受け取ることで依存配列を不要にする
  const generatePreview = useCallback(async (estimate: Estimate) => {
    try {
      const blob = await pdf(
        <EstimatePDFDocument estimate={estimate} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);

      setPdfUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return url;
      });

      // ファイル名を生成: YYMMDD_顧客名_御見積書.pdf
      const issueDate = estimate.issue_date
        ? new Date(estimate.issue_date)
        : new Date();
      const dateStr = issueDate
        .toLocaleDateString("ja-JP", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "");
      const customerName = estimate.customer_name || "お客様";
      const filename = `${dateStr}_${customerName}_御見積書.pdf`;
      setPdfFilename(filename);
    } catch (error) {
      console.error("PDF生成エラー:", error);
    }
  }, []);

  // PDF生成
  useEffect(() => {
    if (debouncedEstimate) {
      generatePreview(debouncedEstimate);
    }
  }, [debouncedEstimate, generatePreview]);

  const handleInputChange = (field: keyof Estimate, value: string) => {
    if (!estimate) return;

    const updated = { ...estimate, [field]: value };
    setEstimate(updated);

    // フォームの値も更新(基本情報のフィールドのみ)
    if (field in form.getValues()) {
      form.setValue(field as keyof z.infer<typeof basicInfoSchema>, value);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof EstimateItem,
    value: string | number,
  ) => {
    if (!estimate || !estimate.items) return;

    const items = [...estimate.items];
    items[index] = { ...items[index], [field]: value };

    if (field === "quantity" || field === "price") {
      items[index].subtotal = items[index].quantity * items[index].price;
    }

    // category_idが変更された場合、categoryオブジェクトも更新
    if (field === "category_id" && typeof value === "string") {
      const category = categories.find((c) => c.id === value);
      if (category) {
        items[index].category = {
          id: category.id,
          name: category.name,
          is_deleted: false,
        };
      }
    }

    setEstimate({
      ...estimate,
      items: items,
    });
  };

  const addItem = () => {
    if (!estimate) return;

    const newItem: EstimateItem = {
      id: crypto.randomUUID(),
      item_name: "",
      category_id: categories[0]?.id || "",
      quantity: 1,
      price: 0,
      subtotal: 0,
      category: {
        id: categories[0]?.id || "",
        name: categories[0]?.name || "",
        is_deleted: false,
      },
    };

    setEstimate({
      ...estimate,
      items: [...(estimate.items || []), newItem],
    });
  };

  const removeItem = (index: number) => {
    if (!estimate || !estimate.items || estimate.items.length <= 1) return;

    const items = estimate.items.filter((_, i) => i !== index);

    setEstimate({
      ...estimate,
      items: items,
    });
  };

  const reorderItems = (startIndex: number, endIndex: number) => {
    if (!estimate || !estimate.items) return;

    const items = Array.from(estimate.items);
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);

    setEstimate({
      ...estimate,
      items: items,
    });
  };

  const handleSave = form.handleSubmit((formData) => {
    if (!estimate || !estimateId) return;

    generatePreview(estimate);

    const updateData: UpdateEstimateRequest = {
      estimate_number: formData.estimate_number,
      status: estimate.status,
      issue_date: formData.issue_date,
      project_name: formData.project_name,
      customer_name: formData.customer_name || undefined,
      in_charge_name: formData.in_charge_name || undefined,
      expiry_date: formData.expiry_date,
      remarks: estimate.remarks || undefined,
      items: estimate.items?.map((item) => ({
        item_name: item.item_name,
        category_id: item.category_id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    updateMutation.mutate({
      estimateId,
      data: updateData,
    });
  });

  return {
    estimate,
    pdfUrl,
    pdfFilename,
    isLoading,
    form,
    categories,
    groups: categories.map((c) => c.name),
    setGroups: (names: string[]) => {
      // 既存カテゴリと新しいカテゴリの差分を検出
      const existingNames = categories.map((c) => c.name);
      const namesToAdd = names.filter((name) => !existingNames.includes(name));
      const namesToRemove = existingNames.filter(
        (name) => !names.includes(name),
      );

      // 削除されたカテゴリを削除
      namesToRemove.forEach((name) => {
        const category = categories.find((c) => c.name === name);
        if (category) {
          removeCategory(category.id);
        }
      });

      // 新規カテゴリを追加
      namesToAdd.forEach((name) => {
        addCategory(name);
      });

      // リネームの検出と実行
      // 削除・追加されていないカテゴリについて、順序が変わっていて名前が違う場合はリネーム
      const remainingOldNames = existingNames.filter(
        (name) => !namesToRemove.includes(name),
      );
      const remainingNewNames = names.filter(
        (name) => !namesToAdd.includes(name),
      );

      // 同じインデックスで名前が異なる場合はリネーム
      const minLen = Math.min(
        remainingOldNames.length,
        remainingNewNames.length,
      );
      for (let i = 0; i < minLen; i++) {
        if (remainingOldNames[i] !== remainingNewNames[i]) {
          const category = categories.find(
            (c) => c.name === remainingOldNames[i],
          );
          if (category) {
            updateCategory(category.id, remainingNewNames[i]);
          }
        }
      }
    },
    handleInputChange,
    handleItemChange,
    addItem,
    removeItem,
    reorderItems,
    handleSave,
  };
}
