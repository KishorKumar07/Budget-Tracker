"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import { updateReminderSchema } from "@/lib/validations/reminder";
import { updateReminderPreferences } from "@/server/services/reminder-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function updateReminderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = updateReminderSchema.safeParse({
    reminderEnabled: formData.get("reminderEnabled") === "on",
    reminderTime: formData.get("reminderTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateReminderPreferences(userId, parsed.data);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/settings/reminders");
  return { success: true };
}
