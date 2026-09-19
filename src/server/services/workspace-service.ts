import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getDefaultCategories } from "@/lib/categories/default-categories";
import { ALL_PERMISSIONS, PERMISSIONS } from "@/lib/permissions/constants";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";

export async function createWorkspace(userId: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name,
        createdById: userId,
        members: {
          create: {
            userId,
            permissions: ALL_PERMISSIONS,
            isCreator: true,
          },
        },
      },
    });

    const defaultCategories = getDefaultCategories();

    await tx.category.createMany({
      data: defaultCategories.map((c) => ({
        workspaceId: workspace.id,
        createdById: userId,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      })),
    });

    return workspace;
  });
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorkspaceMemberCount(workspaceId: string) {
  return prisma.workspaceMember.count({ where: { workspaceId } });
}

export async function getWorkspaceForUser(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have access to this workspace.");
  }

  return { workspace: membership.workspace, membership };
}

export async function updateWorkspaceName(workspaceId: string, name: string) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });
}

/**
 * Removes a member from a workspace. If the member being removed is the
 * workspace creator, admin standing is transferred to the longest-standing
 * remaining member first — a workspace must never end up with no member
 * capable of managing it. Throws if the creator is the only member left.
 */
export async function removeWorkspaceMember(workspaceId: string, memberUserId: string) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
    });

    if (!target) {
      throw new ForbiddenError("This person is not a member of this workspace.");
    }

    if (target.isCreator) {
      const nextAdmin = await tx.workspaceMember.findFirst({
        where: { workspaceId, userId: { not: memberUserId } },
        orderBy: { joinedAt: "asc" },
      });

      if (!nextAdmin) {
        throw new KnownError(
          "You are the only member of this workspace. Delete the workspace instead of removing yourself."
        );
      }

      await tx.workspaceMember.update({
        where: { id: nextAdmin.id },
        data: { isCreator: true, permissions: ALL_PERMISSIONS },
      });

      await tx.workspace.update({
        where: { id: workspaceId },
        data: { createdById: nextAdmin.userId },
      });
    }

    await tx.workspaceMember.delete({ where: { id: target.id } });
  });
}

export async function updateMemberPermissions(
  workspaceId: string,
  memberUserId: string,
  permissions: string[],
  actingUserPermissions: string[]
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
  });

  if (!member) {
    throw new ForbiddenError("This person is not a member of this workspace.");
  }

  // The creator's permissions are the workspace's ultimate safety net —
  // never let them be edited down. Transfer creator status instead.
  if (member.isCreator) {
    throw new ForbiddenError(
      "The workspace creator always has full access. Transfer admin status to change this."
    );
  }

  // A member can never grant a permission they don't hold themselves —
  // otherwise someone with only member.update_permissions could escalate
  // themselves (or a colluding account) to full workspace access.
  const actingSet = new Set(actingUserPermissions);
  const grantedBeyondActor = permissions.filter((p) => !actingSet.has(p));
  if (grantedBeyondActor.length > 0) {
    throw new ForbiddenError(
      "You can't grant permissions you don't have yourself."
    );
  }

  return prisma.workspaceMember.update({
    where: { id: member.id },
    data: { permissions },
  });
}

export function assertNotSelfLockout(
  actingUserPermissions: string[],
  targetIsSelf: boolean,
  newPermissions: string[]
) {
  if (
    targetIsSelf &&
    actingUserPermissions.includes(PERMISSIONS.MEMBER_UPDATE_PERMISSIONS) &&
    !newPermissions.includes(PERMISSIONS.MEMBER_UPDATE_PERMISSIONS)
  ) {
    throw new ForbiddenError(
      "You cannot remove your own permission-management access."
    );
  }
}
