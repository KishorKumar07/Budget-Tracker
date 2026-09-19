import Link from "next/link";
import { BudgetProgress } from "@/components/budgets/budget-progress";

type BudgetSummaryItem = {
  id: string;
  categoryName: string;
  categoryIcon: string;
  spent: number;
  amount: number;
};

export function BudgetSummary({
  budgets,
  currency,
}: {
  budgets: BudgetSummaryItem[];
  currency: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">Budget Progress</p>
        <Link href="/budgets" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {budgets.map((b) => (
          <div key={b.id}>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm text-foreground">
              <span>{b.categoryIcon}</span>
              {b.categoryName}
            </p>
            <BudgetProgress spent={b.spent} budget={b.amount} currency={currency} />
          </div>
        ))}
      </div>
    </div>
  );
}
