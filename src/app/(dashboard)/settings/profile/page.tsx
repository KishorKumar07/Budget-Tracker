import { requireAuth } from "@/lib/auth/guards";
import { getUserProfile } from "@/server/services/user-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const { userId } = await requireAuth();
  const user = await getUserProfile(userId);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Profile" description="Your personal details and preferences." />
      <div className="p-4 md:p-8">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <ProfileForm
              name={user.name}
              email={user.email}
              image={user.image}
              currency={user.currency}
              timezone={user.timezone}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
