import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { prisma } from "@/lib/db/prisma";
import { getWorkspaceInvitations } from "@/server/services/invitation-service";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { MemberCard } from "@/components/members/member-card";
import { PendingInvitationCard } from "@/components/members/pending-invitation-card";
import { InviteMemberSheet } from "@/components/members/invite-member-sheet";

export default async function MembersPage() {
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const permissions = active.membership.permissions;
  if (!permissions.includes(PERMISSIONS.MEMBER_VIEW)) {
    redirect("/dashboard");
  }

  const canInvite = permissions.includes(PERMISSIONS.MEMBER_INVITE);
  const canManagePermissions = permissions.includes(PERMISSIONS.MEMBER_UPDATE_PERMISSIONS);
  const canRemove = permissions.includes(PERMISSIONS.MEMBER_REMOVE);

  const [members, invitations] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: active.workspace.id },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),
    canInvite ? getWorkspaceInvitations(active.workspace.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Members"
        description="People with access to this workspace."
        action={canInvite ? <InviteMemberSheet workspaceId={active.workspace.id} /> : undefined}
      />

      <div className="flex flex-col gap-3 p-4 md:p-8">
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Invite someone to start sharing this workspace."
          />
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              workspaceId={active.workspace.id}
              memberUserId={member.userId}
              name={member.user.name}
              email={member.user.email}
              image={member.user.image}
              permissions={member.permissions}
              isCreator={member.isCreator}
              canManagePermissions={canManagePermissions}
              canRemove={canRemove}
              isSelf={member.userId === active.membership.userId}
            />
          ))
        )}

        {invitations.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">Pending invitations</p>
            {invitations.map((invitation) => (
              <PendingInvitationCard
                key={invitation.id}
                workspaceId={active.workspace.id}
                invitationId={invitation.id}
                email={invitation.email}
                permissionCount={invitation.permissions.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
