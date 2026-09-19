import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/layout/list-skeleton";

export default function TransactionsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8 md:py-6">
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:gap-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex-1 px-4 pb-6 md:px-8">
        <ListSkeleton />
      </div>
    </div>
  );
}
