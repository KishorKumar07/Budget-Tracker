"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePicker } from "@/components/ui/date-picker";
import { SubmitButton } from "@/components/layout/submit-button";
import { CategorySelector, type SelectableCategory } from "@/components/categories/category-selector";
import { createTransactionAction, type ActionState } from "@/app/(dashboard)/transactions/actions";
import { PAYMENT_METHODS } from "@/lib/validations/transaction";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

const PAYMENT_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  OTHER: "Other",
};

const TYPE_LABELS: Record<"EXPENSE" | "INCOME" | "SAVINGS", string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  SAVINGS: "Savings",
};

export function AddTransactionSheet({
  workspaceId,
  defaultDate,
  open,
  onOpenChange,
  expenseCategories,
  incomeCategories,
  savingsCategories,
  frequentlyUsedExpense,
  frequentlyUsedIncome,
  frequentlyUsedSavings,
}: {
  workspaceId: string;
  /** ISO date the Date field starts on — follows the month being viewed. */
  defaultDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  frequentlyUsedExpense: SelectableCategory[];
  frequentlyUsedIncome: SelectableCategory[];
  frequentlyUsedSavings: SelectableCategory[];
}) {
  const [state, formAction] = useActionState(createTransactionAction, initialState);
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "SAVINGS">("EXPENSE");
  const [category, setCategory] = useState<SelectableCategory | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const lastHandledState = useRef(initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success(`${TYPE_LABELS[type]} saved.`);
      formRef.current?.reset();
      setCategory(null);
      setShowMore(false);
      setFormKey((k) => k + 1);
      onOpenChange(false);
    }
    lastHandledState.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const categories =
    type === "EXPENSE" ? expenseCategories : type === "INCOME" ? incomeCategories : savingsCategories;
  const frequentlyUsed =
    type === "EXPENSE" ? frequentlyUsedExpense : type === "INCOME" ? frequentlyUsedIncome : frequentlyUsedSavings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[90vh] w-full rounded-t-2xl sm:max-w-md md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:rounded-none md:border-l">
        <SheetHeader>
          <SheetTitle>Add {TYPE_LABELS[type]}</SheetTitle>
        </SheetHeader>

        <form ref={formRef} action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="categoryId" value={category?.id ?? ""} />

          <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Transaction type">
            {(["EXPENSE", "INCOME", "SAVINGS"] as const).map((choice) => (
              <TypeToggleButton
                key={choice}
                active={type === choice}
                onClick={() => { setType(choice); setCategory(null); }}
              >
                {TYPE_LABELS[choice]}
              </TypeToggleButton>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              autoFocus
              className="h-12 text-2xl font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="add-transaction-category">Category</Label>
            <CategorySelector
              id="add-transaction-category"
              workspaceId={workspaceId}
              type={type}
              categories={categories}
              frequentlyUsed={frequentlyUsed}
              value={category}
              onChange={setCategory}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Lunch" maxLength={200} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker key={`${formKey}-${defaultDate}`} id="date" name="date" defaultValue={defaultDate} required />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1 self-start text-sm font-medium text-primary"
          >
            <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} />
            More details
          </button>

          {showMore && (
            <div className="flex flex-col gap-4 rounded-lg border border-border p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentMethod">Payment method</Label>
                <NativeSelect id="paymentMethod" name="paymentMethod" defaultValue="UPI">
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_LABELS[method]}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Optional notes" maxLength={1000} />
              </div>
            </div>
          )}

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <SheetFooter className="mt-auto px-0 pb-4">
            <SubmitButton>Save {TYPE_LABELS[type]}</SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function TypeToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
