-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderTime" TEXT NOT NULL DEFAULT '20:00';
