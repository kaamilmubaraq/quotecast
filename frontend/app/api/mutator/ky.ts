import ky, { HTTPError, type KyInstance, type Options } from "ky";

const KY_INSTANCE: KyInstance = ky.create({
  timeout: 10000,
  hooks: {
    beforeRequest: [],
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          error.message = `${error.message}: ${await response.text()}`;
        }

        return error;
      },
    ],
  },
});

export const kyInstance = async <T>(
  config: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: unknown;
    params?: Record<string, string | number | boolean | null | undefined>;
    responseType?: string;
    signal?: AbortSignal;
    headers?: Record<string, string | undefined>;
  },
  options?: Options,
): Promise<T> => {
  const {
    url,
    method,
    data,
    params,
    responseType,
    signal,
    headers: headerConfig,
  } = config;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...headerConfig,
    ...options?.headers,
  };

  // 未設定のクエリパラメータは送らない
  // （null / undefined をそのまま渡すと "null" という文字列になってしまう）
  const searchParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(
          (entry): entry is [string, string | number | boolean] =>
            entry[1] !== null && entry[1] !== undefined,
        ),
      )
    : undefined;

  const kyOptions: Options = {
    ...options,
    json: data,
    method,
    searchParams,
    signal,
    headers,
  };

  const response = await KY_INSTANCE(url, kyOptions);

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
};

export default kyInstance;

export type ErrorType<Error> = HTTPError<Error>;
