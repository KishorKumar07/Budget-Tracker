"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { BudgetProgress } from "./budget-progress";
import { updateBudgetAction, deleteBudgetAction, type ActionState } from "@/app/(dashboard)/budgets/actions";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

export function BudgetCard({
  workspaceId,
  budgetId,
  categoryName,
  categoryIcon,
  spent,
  amount,
  currency,
  canUpdate,
  canDelete,
}: {
  workspaceId: string;
  budgetId: string;
  categoryName: string;
  categoryIcon: string;
  spent: number;
  amount: number;
  currency: string;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateBudgetAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Budget updated.");
      setEditing(false);
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryIcon}</span>
            <span className="text-sm font-medium text-foreground">{categoryName}</span>
          </div>
          <div className="flex items-center gap-1">
            {canUpdate && (
              <Button variant="ghost" size="icon-sm" aria-label="Edit budget" onClick={() => setEditing((v) => !v)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canDelete && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Delete budget">
                    <Trash2 className="size-3.5" />
                  </Button>
                }
                title={`Delete ${categoryName} budget?`}
                description="This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={async () => {
                  await deleteBudgetAction(workspaceId, budgetId);
                  toast.success("Budget deleted.");
                }}
              />
            )}
          </div>
        </div>

        {editing ? (
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="budgetId" value={budgetId} />
            <Input
              key={amount}
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={amount}
              required
              className="h-8"
            />
            <SubmitButton className="w-fit">Save</SubmitButton>
          </form>
        ) : (
          <BudgetProgress spent={spent} budget={amount} currency={currency} />
        )}

        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
