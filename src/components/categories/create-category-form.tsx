"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCategoryAction, type ActionState } from "@/lib/categories/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/layout/submit-button";
import { cn } from "@/lib/utils";

const ICON_CHOICES = [
  "🐾", "🎁", "🧾", "🧺", "🧴", "🛋", "🧹", "🎈", "🧯", "🪴",
  "🚲", "🛴", "🧳", "🖥️", "🎧", "📷", "🕹️", "🧵", "🧶", "🧁",
];

const initialState: ActionState = {};

export function CreateCategoryForm({
  workspaceId,
  defaultType,
  allowTypeChoice = false,
  parentId,
  parentName,
  onCreated,
}: {
  workspaceId: string;
  defaultType: "EXPENSE" | "INCOME" | "SAVINGS";
  /** Show a type toggle instead of locking to defaultType — for
   * standalone contexts (e.g. Settings) with no active transaction type. */
  allowTypeChoice?: boolean;
  /** Create as a subcategory under this category instead of a top-level
   * one. Type is forced to the parent's own type. */
  parentId?: string;
  parentName?: string;
  onCreated?: (category: { id: string; name: string; icon: string }) => void;
}) {
  const [state, formAction] = useActionState(createCategoryAction, initialState);
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "SAVINGS">(defaultType);
  const nameRef = useRef<HTMLInputElement>(null);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success && state.categoryId && onCreated) {
      onCreated({
        id: state.categoryId,
        name: nameRef.current?.value ?? "",
        icon,
      });
    }
    lastHandledState.current = state;
    // icon intentionally omitted: we want the icon at submit time, not
    // to re-run this effect whenever the user changes their icon pick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="icon" value={icon} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      {parentName && (
        <p className="text-sm text-muted-foreground">
          Subcategory of <span className="font-medium text-foreground">{parentName}</span>
        </p>
      )}

      {allowTypeChoice && !parentId && (
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Category type">
          {(["EXPENSE", "INCOME", "SAVINGS"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setType(choice)}
              aria-pressed={type === choice}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === choice ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {choice === "EXPENSE" ? "Expense" : choice === "INCOME" ? "Income" : "Savings"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          ref={nameRef}
          placeholder="Pet Supplies"
          maxLength={40}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label id="icon-picker-label">Icon</Label>
        <div className="grid grid-cols-10 gap-1" role="group" aria-labelledby="icon-picker-label">
          {ICON_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setIcon(choice)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-base transition-colors hover:bg-accent",
                icon === choice && "bg-accent ring-1 ring-primary"
              )}
              aria-label={`Use icon ${choice}`}
              aria-pressed={icon === choice}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton>Create Category</SubmitButton>
    </form>
  );
}
