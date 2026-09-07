import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  showBackButton?: boolean;
}

/**
 * 画面見出し
 *
 * ダッシュボードや一覧の見出しと同じ組み方に揃える。
 * 同じ役割の要素が画面ごとに違う見た目になるのを避けるため。
 */
export default function PageHeader({
  title,
  description,
  backLink,
  showBackButton = false,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[88rem] items-center gap-2 px-4 py-3 sm:px-6">
        {showBackButton && backLink && (
          <Link
            to={backLink}
            aria-label={title}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
