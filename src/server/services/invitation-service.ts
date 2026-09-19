import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createInvitation(
  workspaceId: string,
  invitedById: string,
  email: string,
  permissions: string[],
  inviterPermissions: string[]
) {
  // An inviter can never grant a permission they don't hold themselves —
  // otherwise inviting a colluding account would be an escalation path.
  const inviterSet = new Set(inviterPermissions);
  const grantedBeyondInviter = permissions.filter((p) => !inviterSet.has(p));
  if (grantedBeyondInviter.length > 0) {
    throw new ForbiddenError("You can't invite someone with permissions you don't have yourself.");
  }

  const existingMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, user: { email } },
  });

  if (existingMember) {
    throw new KnownError("This person is already a member of this workspace.");
  }

  const existingPending = await prisma.invitation.findFirst({
    where: { workspaceId, email, status: "PENDING" },
  });

  if (existingPending) {
    throw new KnownError("An invitation is already pending for this email.");
  }

  const token = crypto.randomBytes(24).toString("hex");

  return prisma.invitation.create({
    data: {
      workspaceId,
      email,
      permissions,
      invitedById,
      token,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });
}

export async function getWorkspaceInvitations(workspaceId: string) {
  return prisma.invitation.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.workspaceId !== workspaceId) {
    throw new ForbiddenError("This invitation does not belong to this workspace.");
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: true, invitedBy: true },
  });

  if (!invitation) return null;

  if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    invitation.status = "EXPIRED";
  }

  return invitation;
}

export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation || invitation.status !== "PENDING") {
    throw new KnownError("This invitation is no longer valid.");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new KnownError("This invitation has expired.");
  }

  if (invitation.email !== userEmail) {
    throw new KnownError("This invitation was sent to a different email address.");
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        permissions: invitation.permissions,
        isCreator: false,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return invitation.workspaceId;
}
