import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getUserWorkspaces } from "@/server/services/workspace-service";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingWorkspacePage() {
  const { userId } = await requireAuth();

  const existing = await getUserWorkspaces(userId);
  if (existing.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Budget Tracker
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          Let&apos;s set up a place to track your money. You can create more
          later.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
