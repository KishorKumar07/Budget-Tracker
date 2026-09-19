import { NextResponse } from "next/server";
import { getUsersWithDueReminders, markReminderSent } from "@/server/services/reminder-service";
import { sendReminderEmail } from "@/lib/email/send-reminder";

/**
 * Runs hourly (see vercel.json). Each user carries their own reminderTime
 * and timezone, so this single hourly sweep is what actually delivers a
 * reminder "at the time they chose" without one cron entry per user.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueUsers = await getUsersWithDueReminders();

  let sent = 0;
  let failed = 0;

  for (const user of dueUsers) {
    try {
      await sendReminderEmail(user.email, user.name);
      await markReminderSent(user.id);
      sent++;
    } catch (error) {
      console.error(`Failed to send reminder to ${user.id}:`, error);
      failed++;
    }
  }

  return NextResponse.json({ checked: dueUsers.length, sent, failed });
}
