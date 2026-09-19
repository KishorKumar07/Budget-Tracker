import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getReminderPreferences } from "@/server/services/reminder-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReminderForm } from "./reminder-form";

export default async function RemindersSettingsPage() {
  const { userId } = await requireAuth();
  const preferences = await getReminderPreferences(userId);
  if (!preferences) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Reminders" description="Get nudged to log your spending every day." />
      <div className="p-4 md:p-8">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <ReminderForm
              reminderEnabled={preferences.reminderEnabled}
              reminderTime={preferences.reminderTime}
              timezone={preferences.timezone}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
