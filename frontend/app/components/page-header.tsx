import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  showBackButton?: boolean;
  showSystemIcon?: boolean;
}

export default function PageHeader({
  title,
  description,
  backLink,
  showBackButton = false,
  showSystemIcon = false,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && backLink ? (
              <Button variant="ghost" size="icon" asChild className="shrink-0">
                <Link to={backLink}>
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
            ) : showSystemIcon ? (
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            ) : null}
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
              {description && (
                <span className="text-slate-500 text-base">{description}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
