import { requireAuth } from "@/lib/auth/guards";
import { getUserProfile } from "@/server/services/user-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function SecuritySettingsPage() {
  const { userId } = await requireAuth();
  const user = await getUserProfile(userId);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Security" description="Manage your password." />
      <div className="p-4 md:p-8">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            {user.passwordHash ? (
              <ChangePasswordForm />
            ) : (
              <p className="text-sm text-muted-foreground">
                This account signs in with Google, so there&apos;s no password to manage here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
