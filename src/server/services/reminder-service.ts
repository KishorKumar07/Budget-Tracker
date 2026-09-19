import "server-only";
import { prisma } from "@/lib/db/prisma";

function localDateAndTime(timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`, // YYYY-MM-DD
    time: `${get("hour")}:${get("minute")}`, // HH:mm
  };
}

/**
 * A user's reminder is "due" once their local clock has reached their
 * chosen time today and no reminder has gone out yet today (in their own
 * timezone) — so a user in a different timezone isn't reminded at the
 * wrong local hour, and a restart or retry never double-sends same-day.
 */
export function isReminderDue(
  user: { reminderEnabled: boolean; reminderTime: string; timezone: string; lastReminderSentAt: Date | null },
  now = new Date()
) {
  if (!user.reminderEnabled) return false;

  const { date: today, time: nowTime } = localDateAndTime(user.timezone, now);
  if (nowTime < user.reminderTime) return false;

  if (user.lastReminderSentAt) {
    const { date: lastSentDate } = localDateAndTime(user.timezone, user.lastReminderSentAt);
    if (lastSentDate === today) return false;
  }

  return true;
}

export async function getUsersWithDueReminders(now = new Date()) {
  const candidates = await prisma.user.findMany({
    where: { reminderEnabled: true },
    select: { id: true, name: true, email: true, timezone: true, reminderEnabled: true, reminderTime: true, lastReminderSentAt: true },
  });

  return candidates.filter((user) => isReminderDue(user, now));
}

export async function markReminderSent(userId: string, sentAt = new Date()) {
  await prisma.user.update({ where: { id: userId }, data: { lastReminderSentAt: sentAt } });
}

export async function updateReminderPreferences(
  userId: string,
  data: { reminderEnabled: boolean; reminderTime: string }
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function getReminderPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reminderEnabled: true, reminderTime: true, timezone: true, lastReminderSentAt: true },
  });
  return user;
}

/**
 * For the lightweight in-app toast: true exactly once per local day, the
 * first time the dashboard loads after the user's chosen reminder time.
 * Marks it sent immediately so a second load the same day is silent.
 */
export async function checkAndMarkInAppReminder(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reminderEnabled: true, reminderTime: true, timezone: true, lastReminderSentAt: true },
  });
  if (!user) return false;

  const due = isReminderDue(user);
  if (due) {
    await markReminderSent(userId);
  }
  return due;
}
