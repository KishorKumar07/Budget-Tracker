"use client";

import { useMemo, useState } from "react";
import { format, isToday, isSameMonth } from "date-fns";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TransactionList, type TransactionRow } from "@/components/transactions/transaction-list";
import { EmptyState } from "@/components/layout/empty-state";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type DaySummary = {
  day: number;
  income: number;
  expense: number;
  savings: number;
  transactions: TransactionRow[];
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({
  month,
  year,
  days,
  currency,
  showCreatedBy,
}: {
  month: number;
  year: number;
  days: DaySummary[];
  currency: string;
  showCreatedBy: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days]);
  const monthAnchor = new Date(year, month - 1, 1);

  const gridStart = startOfWeek(startOfMonth(monthAnchor));
  const gridEnd = endOfWeek(endOfMonth(monthAnchor));
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
  });

  const hasAnyActivity = days.length > 0;

  const selected = selectedDay !== null ? byDay.get(selectedDay) : undefined;
  const selectedDate = selectedDay !== null ? new Date(year, month - 1, selectedDay) : null;

  if (!hasAnyActivity) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No transactions this month"
        description="Once you add transactions, you'll see them laid out by day here."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((date) => {
            const inMonth = isSameMonth(date, monthAnchor);
            const day = date.getDate();
            const summary = inMonth ? byDay.get(day) : undefined;
            const today = isToday(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!inMonth}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex min-h-20 flex-col items-start gap-0.5 border-r border-b border-border p-1.5 text-left last:border-r-0 sm:min-h-24 sm:p-2",
                  inMonth ? "hover:bg-accent" : "bg-muted/30",
                  !inMonth && "pointer-events-none"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    inMonth ? "text-foreground" : "text-muted-foreground/40",
                    today && "bg-primary text-primary-foreground"
                  )}
                >
                  {day}
                </span>

                {summary && (
                  <div className="flex w-full flex-col gap-0.5 text-[10px] leading-tight sm:text-xs">
                    {summary.income > 0 && (
                      <span className="truncate text-success">+{formatter.format(summary.income)}</span>
                    )}
                    {summary.expense > 0 && (
                      <span className="truncate text-foreground">-{formatter.format(summary.expense)}</span>
                    )}
                    {summary.savings > 0 && (
                      <span className="truncate text-sky-500">↳{formatter.format(summary.savings)}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent side="bottom" className="mx-auto max-h-[85vh] w-full rounded-t-2xl sm:max-w-md md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:rounded-none md:border-l">
          <SheetHeader>
            <SheetTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {selected && selected.transactions.length > 0 ? (
              <TransactionList
                workspaceId=""
                transactions={selected.transactions}
                currency={currency}
                canUpdate={false}
                canDelete={false}
                showCreatedBy={showCreatedBy}
                onEdit={() => {}}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transactions on this day.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
