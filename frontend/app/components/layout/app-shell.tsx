import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ChevronsUpDown,
  FileText,
  LayoutDashboard,
  Languages,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useTheme } from "@/lib/theme";
import type { TranslationKey } from "@/i18n/dictionary";

interface NavLink {
  to: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}

const NAV_LINKS: NavLink[] = [
  { to: "/estimates", labelKey: "nav.estimates", icon: FileText },
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
];

function BrandMark() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
      >
        <ChevronsUpDown className="size-4 rotate-45" strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">
          {t("app.name")}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {t("app.tagline")}
        </span>
      </span>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <nav aria-label={t("nav.section.main")} className="px-2">
      <ul className="space-y-0.5">
        {NAV_LINKS.map(({ to, labelKey, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(`${to}/`);

          return (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const label = theme === "dark" ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun className="size-4" strokeWidth={2} />
      ) : (
        <Moon className="size-4" strokeWidth={2} />
      )}
    </button>
  );
}

function LanguageToggle() {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={t("lang.switch")}
      aria-label={t("lang.switch")}
      className="flex h-8 items-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
    >
      <Languages className="size-4" strokeWidth={2} />
      <span className="text-xs font-medium uppercase tabular">{locale}</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      {/* デスクトップ: 常時表示のサイドバー */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="sticky top-0 flex h-screen flex-col">
          <BrandMark />
          <div className="mt-2 flex-1 overflow-y-auto">
            <SidebarNav />
          </div>
          <div className="flex items-center gap-1 border-t border-sidebar-border p-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </aside>

      {/* モバイル: 上部バー + 引き出しナビ */}
      <div className="flex flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-sidebar px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label={t("nav.section.main")}
            aria-expanded={isMobileNavOpen}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Menu className="size-5" strokeWidth={2} />
          </button>
          <span className="text-sm font-semibold tracking-tight">
            {t("app.name")}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label={t("action.clear")}
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-foreground/25"
            />
            <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
              <div className="flex items-start justify-between">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label={t("action.clear")}
                  className="m-3 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
              <SidebarNav onNavigate={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
