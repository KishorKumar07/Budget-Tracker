import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AppearanceForm } from "./appearance-form";

export default function AppearanceSettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Appearance" description="Customize how Budget Tracker looks on this device." />
      <div className="p-4 md:p-8">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <AppearanceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
