"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revokeInvitationAction } from "@/app/(dashboard)/settings/members/actions";
import { useTransition } from "react";

export function PendingInvitationCard({
  workspaceId,
  invitationId,
  email,
  permissionCount,
}: {
  workspaceId: string;
  invitationId: string;
  email: string;
  permissionCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Invitation pending · {permissionCount} permissions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => revokeInvitationAction(workspaceId, invitationId))}
        >
          Revoke
        </Button>
      </CardContent>
    </Card>
  );
}
