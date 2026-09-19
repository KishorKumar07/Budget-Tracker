"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import { updateProfileSchema } from "@/lib/validations/profile";
import { updateUserProfile } from "@/server/services/user-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateUserProfile(userId, parsed.data);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
