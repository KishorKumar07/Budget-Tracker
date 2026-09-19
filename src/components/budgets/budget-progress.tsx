import { calculateBudgetUsage, calculateRemainingBudget, getBudgetStatus } from "@/lib/calculations/finance";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ReturnType<typeof getBudgetStatus>, string> = {
  under: "Under budget",
  near: "Near limit",
  over: "Over budget",
};

const STATUS_BAR_CLASS: Record<ReturnType<typeof getBudgetStatus>, string> = {
  under: "bg-primary",
  near: "bg-warning",
  over: "bg-destructive",
};

const STATUS_TEXT_CLASS: Record<ReturnType<typeof getBudgetStatus>, string> = {
  under: "text-muted-foreground",
  near: "text-warning",
  over: "text-destructive",
};

export function BudgetProgress({
  spent,
  budget,
  currency,
}: {
  spent: number;
  budget: number;
  currency: string;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  const usage = calculateBudgetUsage(spent, budget);
  const remaining = calculateRemainingBudget(budget, spent);
  const status = getBudgetStatus(usage);
  const barWidth = Math.min(usage, 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">
          {formatter.format(spent)} / {formatter.format(budget)}
        </span>
        <span className={cn("text-xs font-medium", STATUS_TEXT_CLASS[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(usage)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn("h-full rounded-full transition-all", STATUS_BAR_CLASS[status])}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {remaining >= 0
          ? `${formatter.format(remaining)} remaining`
          : `${formatter.format(Math.abs(remaining))} over budget`}
      </p>
    </div>
  );
}
