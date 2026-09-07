import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCategoriesApiCategoriesGet,
  useCreateCategoryApiCategoriesPost,
  useUpdateCategoryApiCategoriesCategoryIdPut,
  useDeleteCategoryApiCategoriesCategoryIdDelete,
  getGetCategoriesApiCategoriesGetQueryKey,
} from "@/gen/categories/categories";
import type { ItemCategory } from "@/lib/types";

export function useItemCategories() {
  const queryClient = useQueryClient();

  // カテゴリ一覧取得
  const { data, isLoading } = useGetCategoriesApiCategoriesGet();
  const categories: ItemCategory[] =
    data?.categories.map((c) => ({ id: c.id, name: c.name })) || [];

  // カテゴリ作成
  const createMutation = useCreateCategoryApiCategoriesPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetCategoriesApiCategoriesGetQueryKey(),
        });
      },
    },
  });

  // カテゴリ更新
  const updateMutation = useUpdateCategoryApiCategoriesCategoryIdPut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetCategoriesApiCategoriesGetQueryKey(),
        });
      },
    },
  });

  // カテゴリ削除
  const deleteMutation = useDeleteCategoryApiCategoriesCategoryIdDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetCategoriesApiCategoriesGetQueryKey(),
        });
      },
    },
  });

  const setCategories = () => {
    // 既存のカテゴリとの差分を検出して、追加・更新・削除を実行
    console.warn("setCategories is not fully implemented for API integration");
  };

  const addCategory = (name: string) => {
    createMutation.mutate({ data: { name } });
  };

  const removeCategory = (id: string) => {
    deleteMutation.mutate({ categoryId: id });
  };

  const updateCategory = (id: string, name: string) => {
    updateMutation.mutate({ categoryId: id, data: { name } });
  };

  return {
    categories,
    setCategories,
    addCategory,
    removeCategory,
    updateCategory,
    isLoading,
  };
}
