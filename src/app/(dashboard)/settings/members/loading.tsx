import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/layout/list-skeleton";

export default function MembersLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8 md:py-6">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-3 p-4 md:p-8">
        <ListSkeleton rows={3} />
      </div>
    </div>
  );
}
