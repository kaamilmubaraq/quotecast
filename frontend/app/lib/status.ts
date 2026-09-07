import type { TranslationKey } from "@/i18n/dictionary";

/** 見積もりのステータス。表示順は業務上の進行順に固定する */
export const STATUS_ORDER = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

export type StatusKey = (typeof STATUS_ORDER)[number];

interface StatusMeta {
  labelKey: TranslationKey;
  /** バッジ（面 + 文字色）。色だけで意味を運ばないよう必ずラベルと併用する */
  badge: string;
  /** 凡例やグラフの塗り */
  fill: string;
}

/**
 * Tailwind はクラス名を静的に走査するため、
 * 文字列を組み立てず完全なクラス名として持つ。
 */
export const STATUS_META: Record<StatusKey, StatusMeta> = {
  draft: {
    labelKey: "status.draft",
    badge: "bg-status-draft-surface text-status-draft",
    fill: "bg-status-draft",
  },
  sent: {
    labelKey: "status.sent",
    badge: "bg-status-sent-surface text-status-sent",
    fill: "bg-status-sent",
  },
  accepted: {
    labelKey: "status.accepted",
    badge: "bg-status-accepted-surface text-status-accepted",
    fill: "bg-status-accepted",
  },
  rejected: {
    labelKey: "status.rejected",
    badge: "bg-status-rejected-surface text-status-rejected",
    fill: "bg-status-rejected",
  },
  expired: {
    labelKey: "status.expired",
    badge: "bg-status-expired-surface text-status-expired",
    fill: "bg-status-expired",
  },
};

export function isStatusKey(value: string): value is StatusKey {
  return (STATUS_ORDER as readonly string[]).includes(value);
}

export function statusMeta(value: string): StatusMeta {
  return isStatusKey(value) ? STATUS_META[value] : STATUS_META.draft;
}
