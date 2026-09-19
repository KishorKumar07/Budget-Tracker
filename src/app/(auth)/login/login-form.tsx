"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
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

        <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-2">
          <Label htmlFor="password" className="col-start-1 row-start-1">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="col-span-2 row-start-2"
          />
          <Link
            href="/forgot-password"
            className="col-start-2 row-start-1 text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton>Sign in</SubmitButton>
      </form>
    </div>
  );
}
