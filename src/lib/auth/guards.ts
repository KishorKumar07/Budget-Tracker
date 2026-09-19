import "server-only";
import { auth } from "./auth";
import { prisma } from "@/lib/db/prisma";
import type { Permission } from "@/lib/permissions/constants";
import { AuthError, ForbiddenError } from "./errors";

export { AuthError, ForbiddenError };

/**
 * Verifies the request has an authenticated session.
 * Must be called first in every Server Action / Route Handler.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("You must be signed in to do that.");
  }
  return { userId: session.user.id, user: session.user };
}

/**
 * Verifies the authenticated user belongs to the given workspace.
 * Returns their membership row (including stored permissions).
 */
export async function requireWorkspaceMembership(workspaceId: string) {
  const { userId } = await requireAuth();

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have access to this workspace.");
  }

  return { userId, membership };
}

/**
 * Verifies the authenticated user belongs to the workspace AND holds the
 * given permission. This is the standard first line of every mutation
 * that touches workspace-scoped data.
 */
export async function requirePermission(
  workspaceId: string,
  permission: Permission
) {
  const { userId, membership } = await requireWorkspaceMembership(workspaceId);

  if (!membership.permissions.includes(permission)) {
    throw new ForbiddenError(
      `You do not have permission to perform this action (${permission}).`
    );
  }

  return { userId, membership };
}
