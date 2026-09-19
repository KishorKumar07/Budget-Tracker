"use server";

import { redirect } from "next/navigation";
import { requireWorkspaceMembership } from "@/lib/auth/guards";
import { setActiveWorkspaceCookie } from "@/lib/workspace/current-workspace";

export async function switchWorkspaceAction(workspaceId: string) {
  await requireWorkspaceMembership(workspaceId);
  await setActiveWorkspaceCookie(workspaceId);
  redirect("/dashboard");
}
