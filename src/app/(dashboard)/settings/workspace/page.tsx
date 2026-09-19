import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceNameForm } from "./workspace-name-form";

export default async function WorkspaceSettingsPage() {
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  if (!active.membership.permissions.includes(PERMISSIONS.WORKSPACE_VIEW)) {
    redirect("/dashboard");
  }

  const canUpdate = active.membership.permissions.includes(PERMISSIONS.WORKSPACE_UPDATE);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Workspace" description="Manage this workspace's basic details." />
      <div className="p-4 md:p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <WorkspaceNameForm
              workspaceId={active.workspace.id}
              currentName={active.workspace.name}
              readOnly={!canUpdate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
