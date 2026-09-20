import { NextResponse } from "next/server";
import { getUsersWithDueReminders, markReminderSent } from "@/server/services/reminder-service";
import { sendReminderEmail } from "@/lib/email/send-reminder";

/**
 * Runs once/day at 20:00 UTC (see vercel.json) — Vercel's Hobby plan
 * caps cron jobs at once/day, so this can't sweep hourly the way it
 * ideally would to hit everyone's exact reminderTime. isReminderDue()
 * still only fires once per user per local day and never double-sends,
 * so this is safe to run at this cadence — a user whose reminderTime
 * falls after 20:00 UTC in their own timezone just gets caught on the
 * *next* day's sweep instead of the same day. The in-app toast (see
 * checkAndMarkInAppReminder) is unaffected — it's evaluated live on
 * dashboard load, not by this cron, so it's still accurate to the minute.
 * Upgrading to Vercel Pro would allow reverting this to hourly.
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
