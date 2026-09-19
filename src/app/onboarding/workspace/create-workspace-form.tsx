"use client";

import { useActionState } from "react";
import { createWorkspaceAction, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

const SUGGESTIONS = ["My Budget", "Family Budget", "Household Budget"];

export function CreateWorkspaceForm() {
  const [state, formAction] = useActionState(createWorkspaceAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          placeholder="My Budget"
          autoComplete="off"
          autoFocus
          required
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTIONS.map((suggestion) => (
            <SuggestionChip key={suggestion} label={suggestion} />
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton>Create workspace</SubmitButton>
    </form>
  );
}

function SuggestionChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={(e) => {
        const form = e.currentTarget.closest("form");
        const input = form?.querySelector<HTMLInputElement>('input[name="name"]');
        if (input) {
          input.value = label;
          input.focus();
        }
      }}
    >
      {label}
    </button>
  );
}
