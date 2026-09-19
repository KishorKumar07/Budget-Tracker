"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ManagePermissionsDialog } from "./manage-permissions-dialog";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { removeMemberAction } from "@/app/(dashboard)/settings/members/actions";

export function MemberCard({
  workspaceId,
  memberUserId,
  name,
  email,
  image,
  permissions,
  isCreator,
  canManagePermissions,
  canRemove,
  isSelf,
}: {
  workspaceId: string;
  memberUserId: string;
  name: string;
  email: string;
  image: string | null;
  permissions: string[];
  isCreator: boolean;
  canManagePermissions: boolean;
  canRemove: boolean;
  isSelf: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar>
          <AvatarImage src={image ?? undefined} />
          <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {name}
            {isSelf && <span className="text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isCreator ? "Full access" : `${permissions.length} permissions`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canManagePermissions && !isCreator && (
            <ManagePermissionsDialog
              workspaceId={workspaceId}
              memberUserId={memberUserId}
              memberName={name}
              currentPermissions={permissions}
            />
          )}
          {canRemove && !isCreator && !isSelf && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  Remove
                </Button>
              }
              title={`Remove ${name}?`}
              description="They will lose access to this workspace immediately. This cannot be undone."
              confirmLabel="Remove"
              onConfirm={async () => {
                const formData = new FormData();
                formData.set("workspaceId", workspaceId);
                formData.set("memberUserId", memberUserId);
                await removeMemberAction(formData);
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
