"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { SubmitButton } from "@/components/layout/submit-button";
import { createBudgetAction, type ActionState } from "@/app/(dashboard)/budgets/actions";

const initialState: ActionState = {};

type CategoryOption = { id: string; name: string; icon: string };

export function CreateBudgetSheet({
  workspaceId,
  month,
  year,
  availableCategories,
}: {
  workspaceId: string;
  month: number;
  year: number;
  availableCategories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createBudgetAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Budget created.");
      setOpen(false);
    }
    lastHandledState.current = state;
  }, [state]);

  if (availableCategories.length === 0 && !open) {
    return (
      <Button disabled title="All categories already have a budget this month">
        <Plus className="size-4" />
        Create Budget
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Create Budget
      </Button>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Create Budget</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 px-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">Category</Label>
            <NativeSelect id="categoryId" name="categoryId" required>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Monthly budget</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="10000"
              required
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <SheetFooter className="mt-auto px-0">
            <SubmitButton>Create Budget</SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
