import "server-only";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth/guards";
import { getUserWorkspaces, getWorkspaceForUser } from "@/server/services/workspace-service";

const ACTIVE_WORKSPACE_COOKIE = "active-workspace-id";

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Resolves the workspace the current request should act on. The cookie is
 * only a UX convenience for "last visited workspace" — membership is
 * always re-verified against the authenticated user here, never trusted
 * from the cookie alone.
 */
export async function getActiveWorkspace() {
  const { userId } = await requireAuth();
  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (cookieWorkspaceId) {
    try {
      return await getWorkspaceForUser(cookieWorkspaceId, userId);
    } catch {
      // Cookie pointed at a workspace the user no longer belongs to.
      // Fall through and pick another one below.
    }
  }

  const workspaces = await getUserWorkspaces(userId);
  const fallback = workspaces[0];

  if (!fallback) {
    return null;
  }

  return getWorkspaceForUser(fallback.id, userId);
}
