"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { updateTransactionAction, type ActionState } from "@/app/(dashboard)/transactions/actions";
import { PAYMENT_METHODS } from "@/lib/validations/transaction";
import type { TransactionRow } from "./transaction-list";

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

export function EditTransactionSheet({
  workspaceId,
  transaction,
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
  transaction: TransactionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  frequentlyUsedExpense: SelectableCategory[];
  frequentlyUsedIncome: SelectableCategory[];
  frequentlyUsedSavings: SelectableCategory[];
}) {
  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EditTransactionForm
        key={transaction.id}
        workspaceId={workspaceId}
        transaction={transaction}
        onOpenChange={onOpenChange}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        savingsCategories={savingsCategories}
        frequentlyUsedExpense={frequentlyUsedExpense}
        frequentlyUsedIncome={frequentlyUsedIncome}
        frequentlyUsedSavings={frequentlyUsedSavings}
      />
    </Sheet>
  );
}

function EditTransactionForm({
  workspaceId,
  transaction,
  onOpenChange,
  expenseCategories,
  incomeCategories,
  savingsCategories,
  frequentlyUsedExpense,
  frequentlyUsedIncome,
  frequentlyUsedSavings,
}: {
  workspaceId: string;
  transaction: TransactionRow;
  onOpenChange: (open: boolean) => void;
  expenseCategories: SelectableCategory[];
  incomeCategories: SelectableCategory[];
  savingsCategories: SelectableCategory[];
  frequentlyUsedExpense: SelectableCategory[];
  frequentlyUsedIncome: SelectableCategory[];
  frequentlyUsedSavings: SelectableCategory[];
}) {
  const [state, formAction] = useActionState(updateTransactionAction, initialState);
  const [category, setCategory] = useState<SelectableCategory | null>({
    id: transaction.category.id,
    name: transaction.category.name,
    icon: transaction.category.icon,
    group: "",
  });
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Transaction updated.");
      onOpenChange(false);
    }
    lastHandledState.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const categories =
    transaction.type === "EXPENSE" ? expenseCategories : transaction.type === "INCOME" ? incomeCategories : savingsCategories;
  const frequentlyUsed =
    transaction.type === "EXPENSE" ? frequentlyUsedExpense : transaction.type === "INCOME" ? frequentlyUsedIncome : frequentlyUsedSavings;

  return (
    <SheetContent side="bottom" className="mx-auto max-h-[90vh] w-full rounded-t-2xl sm:max-w-md md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:rounded-none md:border-l">
      <SheetHeader>
        <SheetTitle>Edit {TYPE_LABELS[transaction.type]}</SheetTitle>
      </SheetHeader>

      <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="transactionId" value={transaction.id} />
          <input type="hidden" name="type" value={transaction.type} />
          <input type="hidden" name="categoryId" value={category?.id ?? ""} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={transaction.amount}
              required
              className="h-12 text-2xl font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-transaction-category">Category</Label>
            <CategorySelector
              id="edit-transaction-category"
              workspaceId={workspaceId}
              type={transaction.type}
              categories={categories}
              frequentlyUsed={frequentlyUsed}
              value={category}
              onChange={setCategory}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              name="description"
              defaultValue={transaction.description ?? ""}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-date">Date</Label>
            <DatePicker
              id="edit-date"
              name="date"
              defaultValue={transaction.date.slice(0, 10)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-paymentMethod">Payment method</Label>
            <NativeSelect id="edit-paymentMethod" name="paymentMethod" defaultValue={transaction.paymentMethod}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_LABELS[method]}
                </option>
              ))}
            </NativeSelect>
          </div>

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

        <SheetFooter className="mt-auto px-0 pb-4">
          <SubmitButton>Save Changes</SubmitButton>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
