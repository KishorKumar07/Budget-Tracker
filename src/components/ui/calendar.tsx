"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  dayContent,
  className,
}: {
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  /** Optional per-day extra content (e.g. a spend indicator dot). */
  dayContent?: (date: Date) => React.ReactNode;
  className?: string;
}) {
  const [internalMonth, setInternalMonth] = useState(() => month ?? selected ?? new Date());
  const visibleMonth = month ?? internalMonth;

  const setMonth = (next: Date) => {
    onMonthChange?.(next);
    if (!month) setInternalMonth(next);
  };

  const gridStart = startOfWeek(startOfMonth(visibleMonth));
  const gridEnd = endOfWeek(endOfMonth(visibleMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => setMonth(subMonths(visibleMonth, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium text-foreground">{format(visibleMonth, "MMMM yyyy")}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(visibleMonth, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex h-7 items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, visibleMonth);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              disabled={!onSelect}
              aria-pressed={isSelected}
              aria-current={today ? "date" : undefined}
              className={cn(
                "relative flex h-9 flex-col items-center justify-center rounded-md text-sm transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                !isSelected && "hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                today && !isSelected && "font-semibold text-primary"
              )}
            >
              {format(day, "d")}
              {dayContent?.(day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
