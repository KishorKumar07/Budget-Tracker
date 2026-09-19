import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight } from "@/server/services/analytics-service";

const TONE_ICON: Record<Insight["tone"], typeof Lightbulb> = {
  positive: TrendingUp,
  neutral: Lightbulb,
  warning: AlertTriangle,
};

const TONE_CLASS: Record<Insight["tone"], string> = {
  positive: "bg-success/10 text-success",
  neutral: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
};

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {insights.map((insight, i) => {
        const Icon = TONE_ICON[insight.tone];
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", TONE_CLASS[insight.tone])}>
              <Icon className="size-4" />
            </span>
            <p className="text-sm text-foreground">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}
