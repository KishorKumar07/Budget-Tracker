"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireAuth } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions/constants";
import {
  inviteMemberSchema,
  updateMemberPermissionsSchema,
  removeMemberSchema,
} from "@/lib/validations/member";
import {
  createInvitation,
  revokeInvitation,
} from "@/server/services/invitation-service";
import {
  removeWorkspaceMember,
  updateMemberPermissions,
  assertNotSelfLockout,
} from "@/server/services/workspace-service";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import { prisma } from "@/lib/db/prisma";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean; warning?: string };

export async function inviteMemberAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = inviteMemberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    permissions: formData.getAll("permissions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { userId, membership } = await requirePermission(parsed.data.workspaceId, PERMISSIONS.MEMBER_INVITE);

  const inviter = await prisma.user.findUnique({ where: { id: userId } });
  const workspace = await prisma.workspace.findUnique({ where: { id: parsed.data.workspaceId } });

  if (!inviter || !workspace) {
    return { error: "Something went wrong. Please try again." };
  }

  let invitation;
  try {
    invitation = await createInvitation(
      parsed.data.workspaceId,
      userId,
      parsed.data.email,
      parsed.data.permissions,
      membership.permissions
    );
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  try {
    await sendInvitationEmail(parsed.data.email, invitation.token, workspace.name, inviter.name);
  } catch {
    // Invitation record exists even if the email failed to send — the
    // workspace admin can see it under "Pending invitations" and share
    // the link manually. This is a warning, not a failure: the sheet
    // should still close and the list should still refresh.
    revalidatePath("/settings/members");
    return { success: true, warning: "Invitation created, but the email could not be sent." };
  }

  revalidatePath("/settings/members");
  return { success: true };
}

export async function revokeInvitationAction(workspaceId: string, invitationId: string) {
  await requirePermission(workspaceId, PERMISSIONS.MEMBER_INVITE);
  await revokeInvitation(workspaceId, invitationId);
  revalidatePath("/settings/members");
}

export async function updateMemberPermissionsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateMemberPermissionsSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    memberUserId: formData.get("memberUserId"),
    permissions: formData.getAll("permissions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { userId, membership } = await requirePermission(
    parsed.data.workspaceId,
    PERMISSIONS.MEMBER_UPDATE_PERMISSIONS
  );

  try {
    assertNotSelfLockout(
      membership.permissions,
      userId === parsed.data.memberUserId,
      parsed.data.permissions
    );
    await updateMemberPermissions(
      parsed.data.workspaceId,
      parsed.data.memberUserId,
      parsed.data.permissions,
      membership.permissions
    );
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/settings/members");
  return { success: true };
}

export async function removeMemberAction(formData: FormData) {
  const parsed = removeMemberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    memberUserId: formData.get("memberUserId"),
  });

  if (!parsed.success) return;

  await requirePermission(parsed.data.workspaceId, PERMISSIONS.MEMBER_REMOVE);
  await removeWorkspaceMember(parsed.data.workspaceId, parsed.data.memberUserId);

  revalidatePath("/settings/members");
}

export async function leaveWorkspaceAction(workspaceId: string) {
  const { userId } = await requireAuth();
  await removeWorkspaceMember(workspaceId, userId);
  revalidatePath("/settings/members");
}
