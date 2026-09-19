import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-8 w-full appearance-none rounded-lg border border-input bg-background px-2.5 pr-7 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
