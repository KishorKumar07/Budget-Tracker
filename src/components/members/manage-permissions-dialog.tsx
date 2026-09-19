"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PermissionSelector } from "./permission-selector";
import { updateMemberPermissionsAction, type ActionState } from "@/app/(dashboard)/settings/members/actions";
import { SubmitButton } from "@/components/layout/submit-button";

const initialState: ActionState = {};

export function ManagePermissionsDialog({
  workspaceId,
  memberUserId,
  memberName,
  currentPermissions,
}: {
  workspaceId: string;
  memberUserId: string;
  memberName: string;
  currentPermissions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateMemberPermissionsAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      toast.success("Permissions updated.");
      setOpen(false);
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage Permissions
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{memberName}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="memberUserId" value={memberUserId} />

          <PermissionSelector name="permissions" defaultValue={currentPermissions} />

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <SubmitButton className="w-fit">Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
