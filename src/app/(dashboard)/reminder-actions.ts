"use server";

import { requireAuth } from "@/lib/auth/guards";
import { checkAndMarkInAppReminder } from "@/server/services/reminder-service";

export async function checkInAppReminderAction() {
  const { userId } = await requireAuth();
  return checkAndMarkInAppReminder(userId);
}
