"use client";

import { useActionState } from "react";
import { acceptInvitationAction, type ActionState } from "./actions";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

export function AcceptInvitationForm({ token }: { token: string }) {
  const boundAction = acceptInvitationAction.bind(null, token);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Accept invitation</SubmitButton>
    </form>
  );
}
