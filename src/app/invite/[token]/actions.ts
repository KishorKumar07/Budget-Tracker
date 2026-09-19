"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { acceptInvitation } from "@/server/services/invitation-service";
import { setActiveWorkspaceCookie } from "@/lib/workspace/current-workspace";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string };

export async function acceptInvitationAction(
  token: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const { userId, user } = await requireAuth();

  let workspaceId: string;
  try {
    workspaceId = await acceptInvitation(token, userId, user.email ?? "");
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  await setActiveWorkspaceCookie(workspaceId);
  redirect("/dashboard");
}
