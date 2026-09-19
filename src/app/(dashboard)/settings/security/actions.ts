"use server";

import { requireAuth } from "@/lib/auth/guards";
import { changePasswordSchema } from "@/lib/validations/profile";
import { changeUserPassword } from "@/server/services/user-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await changeUserPassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  return { success: true };
}
