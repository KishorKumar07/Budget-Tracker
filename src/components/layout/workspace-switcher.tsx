"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchWorkspaceAction } from "@/app/(dashboard)/switch-workspace-action";

type WorkspaceOption = { id: string; name: string };

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
      >
        <span className="truncate">{active?.name ?? "Select workspace"}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() =>
              startTransition(() => {
                switchWorkspaceAction(workspace.id);
              })
            }
            className="flex items-center justify-between"
          >
            <span className="truncate">{workspace.name}</span>
            {workspace.id === activeWorkspaceId && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/onboarding/workspace/new")}
          className="flex items-center gap-2"
        >
          <Plus className="size-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
