"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateWorkspaceAction, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

export function WorkspaceNameForm({
  workspaceId,
  currentName,
  readOnly,
}: {
  workspaceId: string;
  currentName: string;
  readOnly: boolean;
}) {
  const [state, formAction] = useActionState(updateWorkspaceAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Workspace updated.");
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          key={currentName}
          id="name"
          name="name"
          defaultValue={currentName}
          disabled={readOnly}
          maxLength={60}
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {!readOnly && <SubmitButton className="w-fit">Save changes</SubmitButton>}
    </form>
  );
}
