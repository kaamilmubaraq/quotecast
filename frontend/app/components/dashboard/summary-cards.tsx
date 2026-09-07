import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, FileText, DollarSign } from "lucide-react";

interface SummaryCardsProps {
  totalCount: number;
  currentMonthCount: number;
  totalAmount: number;
  averageAmount: number;
}

export function SummaryCards({
  totalCount,
  currentMonthCount,
  totalAmount,
  averageAmount,
}: SummaryCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="pb-3">
          <CardDescription className="text-blue-600 font-medium">
            総見積もり件数
          </CardDescription>
          <CardTitle className="text-4xl font-bold text-blue-900">
            {totalCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-blue-600">
            <FileText className="w-4 h-4 mr-1" />
            全期間
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-white">
        <CardHeader className="pb-3">
          <CardDescription className="text-green-600 font-medium">
            今月の見積もり
          </CardDescription>
          <CardTitle className="text-4xl font-bold text-green-900">
            {currentMonthCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            今月
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-3">
          <CardDescription className="text-purple-600 font-medium">
            総見積もり金額
          </CardDescription>
          <CardTitle className="text-3xl font-bold text-purple-900">
            ¥{totalAmount.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-purple-600">
            <DollarSign className="w-4 h-4 mr-1" />
            全期間
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-white">
        <CardHeader className="pb-3">
          <CardDescription className="text-amber-600 font-medium">
            平均見積もり金額
          </CardDescription>
          <CardTitle className="text-3xl font-bold text-amber-900">
            ¥{Math.round(averageAmount).toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-amber-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            1件あたり
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
