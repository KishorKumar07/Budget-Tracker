"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/layout/submit-button";
import { CheckCircle2 } from "lucide-react";

const initialState: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/40 p-4 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <p className="text-sm font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          If an account exists with that email, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}
