"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePickerButton } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTransactionsBulkAction } from "@/app/(dashboard)/transactions/actions";
import { PAYMENT_METHODS } from "@/lib/validations/transaction";
import type { SelectableCategory } from "@/components/categories/category-selector";
import { defaultEntryDate } from "@/lib/utils/entry-date";

type DraftRow = {
  key: string;
  type: "EXPENSE" | "INCOME" | "SAVINGS";
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
};

function emptyRow(date: string): DraftRow {
  return {
    key: crypto.randomUUID(),
    type: "EXPENSE",
    amount: "",
    categoryId: "",
    description: "",
    date,
    paymentMethod: "OTHER",
  };
}

export function BulkAddDialog({
  workspaceId,
  defaultDate = defaultEntryDate(),
  expenseCategories,
  incomeCategories,
  savingsCategories,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  showTrigger = true,
}: {
  workspaceId: string;
  /** ISO date new rows start on. Defaults to today (in the browser's timezone). */
  defaultDate?: string;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  /** Externally-controlled open state, e.g. when triggered from the sidebar
   * instead of this component's own "Add Multiple" button. Falls back to
   * internal state when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in "Add Multiple" trigger button — used when the dialog
   * is opened externally (e.g. from the sidebar's Add Transaction menu). */
  showTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  const [rows, setRows] = useState<DraftRow[]>([emptyRow(defaultDate)]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(defaultDate)]);
  const removeRow = (key: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const reset = () => {
    setRows([emptyRow(defaultDate)]);
    setError(null);
  };

  const handleSave = () => {
    setError(null);

    const invalidRow = rows.find((r) => !r.amount || Number(r.amount) <= 0 || !r.categoryId);
    if (invalidRow) {
      setError("Every row needs an amount greater than 0 and a category.");
      return;
    }

    startTransition(async () => {
      const result = await createTransactionsBulkAction(
        workspaceId,
        rows.map((r) => ({
          type: r.type,
          amount: Number(r.amount),
          categoryId: r.categoryId,
          description: r.description || undefined,
          date: new Date(r.date),
          paymentMethod: r.paymentMethod,
        }))
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(
        `Added ${result.createdCount} transaction${result.createdCount === 1 ? "" : "s"}.`
      );
      reset();
      setOpen(false);
    });
  };

  return (
    <>
      {showTrigger && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Layers className="size-4" />
          Add Multiple
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          setOpen(next);
        }}
      >
        <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-4 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Multiple Transactions</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="text-left text-xs font-medium text-muted-foreground">
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Payment</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <BulkAddRow
                    key={row.key}
                    row={row}
                    categories={
                      row.type === "EXPENSE"
                        ? expenseCategories
                        : row.type === "INCOME"
                          ? incomeCategories
                          : savingsCategories
                    }
                    onChange={(patch) => updateRow(row.key, patch)}
                    onRemove={() => removeRow(row.key)}
                    canRemove={rows.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" className="w-fit" onClick={addRow}>
            <Plus className="size-3.5" />
            Add Row
          </Button>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Save {rows.length} Transaction{rows.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BulkAddRow({
  row,
  categories,
  onChange,
  onRemove,
  canRemove,
}: {
  row: DraftRow;
  categories: SelectableCategory[];
  onChange: (patch: Partial<DraftRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <tr>
      <td className="px-2 py-1.5">
        <NativeSelect
          value={row.type}
          onChange={(e) => onChange({ type: e.target.value as "EXPENSE" | "INCOME" | "SAVINGS", categoryId: "" })}
          className="min-w-24"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
          <option value="SAVINGS">Savings</option>
        </NativeSelect>
      </td>
      <td className="px-2 py-1.5">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={row.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          className="w-28"
        />
      </td>
      <td className="px-2 py-1.5">
        <NativeSelect
          value={row.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="min-w-36"
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </NativeSelect>
      </td>
      <td className="px-2 py-1.5">
        <Input
          placeholder="Optional"
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="min-w-36"
        />
      </td>
      <td className="px-2 py-1.5">
        <DatePickerButton
          value={row.date}
          onChange={(date) => onChange({ date })}
          className="min-w-36"
        />
      </td>
      <td className="px-2 py-1.5">
        <NativeSelect
          value={row.paymentMethod}
          onChange={(e) => onChange({ paymentMethod: e.target.value as DraftRow["paymentMethod"] })}
          className="min-w-28"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m.replace("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </td>
      <td className="px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove row"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}
