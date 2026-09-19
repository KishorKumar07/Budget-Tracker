"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { createWorkspace } from "@/server/services/workspace-service";
import { setActiveWorkspaceCookie } from "@/lib/workspace/current-workspace";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string };

export async function createWorkspaceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const workspace = await createWorkspace(userId, parsed.data.name);
    await setActiveWorkspaceCookie(workspace.id);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  redirect("/dashboard");
}
