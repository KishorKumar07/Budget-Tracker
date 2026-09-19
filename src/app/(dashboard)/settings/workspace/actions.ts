"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import { updateWorkspaceName } from "@/server/services/workspace-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function updateWorkspaceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateWorkspaceSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await requirePermission(parsed.data.workspaceId, PERMISSIONS.WORKSPACE_UPDATE);
  } catch {
    return { error: "You don't have permission to update this workspace." };
  }

  try {
    await updateWorkspaceName(parsed.data.workspaceId, parsed.data.name);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/settings/workspace");
  return { success: true };
}
