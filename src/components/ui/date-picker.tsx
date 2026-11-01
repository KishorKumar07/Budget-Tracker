"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function toLocalISODate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

/**
 * Controlled calendar-popover date field — value/onChange carry the ISO
 * date string. Use this directly for state-driven forms (e.g. table rows);
 * see DatePicker for the uncontrolled, FormData-submitted variant.
 */
export function DatePickerButton({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !selectedDate && "text-muted-foreground")}>
          {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-0 p-2">
        <Calendar
          selected={selectedDate}
          onSelect={(date) => {
            onChange(toLocalISODate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * A calendar-popover date field that still submits as a plain form field —
 * a hidden input carries the ISO value so it works with the existing
 * useActionState/FormData server action flow unchanged.
 */
export function DatePicker({
  id,
  name,
  defaultValue,
  required,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? "");

  return (
    <>
      <input type="hidden" name={name} value={value} required={required} />
      <DatePickerButton id={id} value={value} onChange={setValue} className="w-full" />
    </>
  );
}
