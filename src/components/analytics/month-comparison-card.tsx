import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthComparisonCard({
  currency,
  month,
  currentExpenses,
  previousExpenses,
  expenseChangePercent,
}: {
  currency: string;
  month: number;
  currentExpenses: number;
  previousExpenses: number;
  expenseChangePercent: number;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const prevMonthIndex = month === 1 ? 11 : month - 2;
  const improving = expenseChangePercent <= 0;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-6 py-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{MONTH_NAMES[month - 1]}</p>
          <p className="text-xl font-semibold text-foreground">{formatter.format(currentExpenses)}</p>
        </div>

        <div className="text-muted-foreground">vs</div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">{MONTH_NAMES[prevMonthIndex]}</p>
          <p className="text-xl font-semibold text-foreground">{formatter.format(previousExpenses)}</p>
        </div>

        {previousExpenses > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              improving ? "text-success" : "text-destructive"
            )}
          >
            {improving ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
            {Math.abs(Math.round(expenseChangePercent))}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
