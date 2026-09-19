import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type RecentTransaction = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE" | "SAVINGS";
  description: string | null;
  date: string;
  category: { name: string; icon: string; color: string };
};

export function RecentTransactions({
  transactions,
  currency,
}: {
  transactions: RecentTransaction[];
  currency: string;
}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">Recent Transactions</p>
        <Link href="/transactions" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: `${t.category.color}20` }}
            >
              {t.category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {t.description || t.category.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {format(new Date(t.date), "MMM d")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                t.type === "INCOME" ? "text-success" : t.type === "SAVINGS" ? "text-sky-500" : "text-foreground"
              )}
            >
              {t.type === "INCOME" ? "+" : "-"}
              {formatter.format(Number(t.amount))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
