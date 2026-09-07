import { Link } from "react-router";
import { AlertTriangle } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { useFormatters, useI18n } from "@/i18n";
import { STATUS_ORDER, statusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold tracking-tight">
        {title}
      </h3>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

function MetricTiles() {
  const { winRate, pipelineAmount, pipelineCount, averageDealSize } =
    useAnalytics();
  const { t } = useI18n();
  const { currency, percent } = useFormatters();

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
      <div className="bg-card px-4 py-3.5" title={t("analytics.winRateHint")}>
        <div className="text-xs text-muted-foreground">
          {t("analytics.winRate")}
        </div>
        <div className="mt-1 text-xl font-semibold tracking-tight tabular">
          {winRate === null ? "—" : percent(winRate)}
        </div>
      </div>

      <div className="bg-card px-4 py-3.5">
        <div className="text-xs text-muted-foreground">
          {t("analytics.pipeline")}
        </div>
        <div className="mt-1 truncate text-xl font-semibold tracking-tight tabular">
          {currency(pipelineAmount)}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground tabular">
          {t("analytics.pipelineCount", { n: pipelineCount })}
        </div>
      </div>

      <div className="bg-card px-4 py-3.5">
        <div className="text-xs text-muted-foreground">
          {t("analytics.averageDeal")}
        </div>
        <div className="mt-1 truncate text-xl font-semibold tracking-tight tabular">
          {currency(averageDealSize)}
        </div>
      </div>
    </div>
  );
}

function StatusBreakdown() {
  const { statusBreakdown } = useAnalytics();
  const { t } = useI18n();
  const { currency, number } = useFormatters();

  const byStatus = new Map(statusBreakdown.map((row) => [row.status, row]));
  const total = statusBreakdown.reduce((sum, row) => sum + row.count, 0);

  return (
    <Panel title={t("analytics.funnel")}>
      {/* 全体に対する構成比を1本の帯で見せてから、内訳を数字で並べる */}
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        {STATUS_ORDER.map((status) => {
          const count = byStatus.get(status)?.count ?? 0;
          if (!count || !total) return null;
          return (
            <span
              key={status}
              className={statusMeta(status).fill}
              style={{ width: `${(count / total) * 100}%` }}
            />
          );
        })}
      </div>

      <ul className="mt-3 space-y-1.5">
        {STATUS_ORDER.map((status) => {
          const row = byStatus.get(status);
          const meta = statusMeta(status);

          return (
            <li
              key={status}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-[2px]", meta.fill)}
                />
                <span className="truncate">{t(meta.labelKey)}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-3 tabular">
                <span className="text-muted-foreground">
                  {t("common.count", { n: number(row?.count ?? 0) })}
                </span>
                <span className="w-24 text-right font-medium">
                  {currency(row?.amount ?? 0)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function TopCustomers() {
  const { topCustomers } = useAnalytics();
  const { t } = useI18n();
  const { currency } = useFormatters();

  const largest = topCustomers[0]?.amount ?? 0;

  return (
    <Panel title={t("analytics.topCustomers")}>
      {topCustomers.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("analytics.noCustomers")}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {topCustomers.map((customer) => (
            <li key={customer.customer_name}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate">{customer.customer_name}</span>
                <span className="shrink-0 font-medium tabular">
                  {currency(customer.amount)}
                </span>
              </div>
              {/* 相対的な大きさが一目で分かるよう、最大値を基準に幅を取る */}
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-chart-actual"
                  style={{
                    width: largest
                      ? `${Math.max((customer.amount / largest) * 100, 2)}%`
                      : "0%",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ExpiringSoon() {
  const { expiringSoon } = useAnalytics();
  const { t } = useI18n();
  const { currency } = useFormatters();

  return (
    <Panel title={t("analytics.expiringSoon")}>
      {expiringSoon.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("analytics.expiringEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {expiringSoon.slice(0, 5).map((estimate) => {
            const isUrgent = estimate.days_remaining <= 3;

            return (
              <li key={estimate.id} className="py-2 first:pt-0 last:pb-0">
                <Link
                  to={`/estimates/${estimate.id}`}
                  className="group flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium group-hover:underline">
                      {estimate.project_name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {estimate.customer_name ?? estimate.estimate_number}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-xs font-medium tabular">
                      {currency(estimate.amount)}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px] tabular",
                        isUrgent
                          ? "font-medium text-status-rejected"
                          : "text-status-expired",
                      )}
                    >
                      {isUrgent && (
                        <AlertTriangle className="size-3" strokeWidth={2.5} />
                      )}
                      {estimate.days_remaining <= 0
                        ? t("analytics.today")
                        : t("analytics.daysRemaining", {
                            n: estimate.days_remaining,
                          })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function AnalyticsSection() {
  const { isLoading, isError, refetch } = useAnalytics();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[5.5rem] animate-pulse rounded-lg border border-border bg-card" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{t("common.error")}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          {t("action.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MetricTiles />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatusBreakdown />
        <TopCustomers />
        <ExpiringSoon />
      </div>
    </div>
  );
}
