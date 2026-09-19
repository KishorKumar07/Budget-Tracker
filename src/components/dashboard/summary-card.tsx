import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-10",
            tone === "success" && "bg-success/10 text-success",
            tone === "danger" && "bg-destructive/10 text-destructive",
            tone === "default" && "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-3.5 sm:size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-base font-semibold text-foreground sm:text-xl md:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
