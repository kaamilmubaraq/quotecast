/* eslint-disable react-refresh/only-export-components -- プロバイダーと、それを読むフックは同じ関心事なので同居させる */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  dictionary,
  type Locale,
  type TranslationKey,
} from "@/i18n/dictionary";

const STORAGE_KEY = "quotecast.locale";
const DEFAULT_LOCALE: Locale = "ja";

type Replacements = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: TranslationKey, replacements?: Replacements) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** {n} や {value} を実際の値に差し替える */
function interpolate(template: string, replacements?: Replacements): string {
  if (!replacements) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = replacements[token];
    return value === undefined ? match : String(value);
  });
}

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "ja" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // サーバー描画とクライアント初期描画を一致させるため、既定値から始めて後で揃える
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocale(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((previous) => {
      const next: Locale = previous === "ja" ? "en" : "ja";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // 保存できなくても切り替えは動かす
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, replacements?: Replacements) =>
      interpolate(dictionary[locale][key], replacements),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, toggleLocale, t }),
    [locale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/** 数値を現在のロケールの桁区切りで整形する */
export function useFormatters() {
  const { locale } = useI18n();

  return useMemo(() => {
    const tag = locale === "ja" ? "ja-JP" : "en-US";
    const number = new Intl.NumberFormat(tag);
    const compactCurrency = new Intl.NumberFormat(tag, {
      notation: "compact",
      maximumFractionDigits: 1,
    });

    return {
      /** 金額（¥1,234,567） */
      currency: (value: number) => `¥${number.format(Math.round(value))}`,
      /** 軸ラベル用の短縮表記（¥1.2M） */
      compactCurrency: (value: number) => `¥${compactCurrency.format(value)}`,
      number: (value: number) => number.format(value),
      percent: (value: number) => `${Math.round(value * 100)}%`,
    };
  }, [locale]);
}
