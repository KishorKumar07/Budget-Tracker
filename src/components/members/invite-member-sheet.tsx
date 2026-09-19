"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { PermissionSelector } from "./permission-selector";
import { inviteMemberAction, type ActionState } from "@/app/(dashboard)/settings/members/actions";
import { SubmitButton } from "@/components/layout/submit-button";
import { DEFAULT_MEMBER_PERMISSIONS } from "@/lib/permissions/constants";

const initialState: ActionState = {};

export function InviteMemberSheet({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(inviteMemberAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      if (state.warning) {
        toast.warning(state.warning);
      } else {
        toast.success("Invitation sent.");
      }
      setOpen(false);
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Invite Member
      </Button>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite Member</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="person@example.com"
              required
            />
          </div>

          <PermissionSelector name="permissions" defaultValue={DEFAULT_MEMBER_PERMISSIONS} />

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <SheetFooter className="px-0">
            <SubmitButton>Send Invitation</SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
