import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { SettingsNav } from "@/components/layout/settings-nav";

export default async function SettingsLayout({ children }: LayoutProps<"/">) {
  const active = await getActiveWorkspace();
  const permissions = active?.membership.permissions ?? [];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <SettingsNav
        showMembers={permissions.includes(PERMISSIONS.MEMBER_VIEW)}
        showWorkspace={permissions.includes(PERMISSIONS.WORKSPACE_VIEW)}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
