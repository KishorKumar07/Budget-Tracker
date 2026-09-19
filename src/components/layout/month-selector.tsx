"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthSelector({ month, year }: { month: number; year: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (nextMonth: number, nextYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(nextMonth));
    params.set("year", String(nextYear));
    router.push(`${pathname}?${params.toString()}`);
  };

  const goPrev = () => (month === 1 ? navigate(12, year - 1) : navigate(month - 1, year));
  const goNext = () => (month === 12 ? navigate(1, year + 1) : navigate(month + 1, year));

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" onClick={goPrev} aria-label="Previous month">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium text-foreground">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button variant="outline" size="icon-sm" onClick={goNext} aria-label="Next month">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
