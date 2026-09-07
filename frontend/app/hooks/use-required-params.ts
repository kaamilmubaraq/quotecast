import { useParams } from "react-router";

/**
 * URLパラメータを型安全に取得するカスタムフック
 * React RouterのuseParams()をラップして、型推論を強化する
 */
export function useRequiredParams<
  T extends Record<string, string | undefined>,
>(): T {
  return useParams() as T;
}
