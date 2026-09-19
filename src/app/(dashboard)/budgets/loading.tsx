import { Skeleton } from "@/components/ui/skeleton";
import { BudgetCardSkeleton } from "@/components/budgets/budget-card-skeleton";

export default function BudgetsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8 md:py-6">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <Skeleton className="h-8 w-40" />
        <BudgetCardSkeleton />
      </div>
    </div>
  );
}
