import { CreateWorkspaceForm } from "../create-workspace-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewWorkspacePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Budget Tracker
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create another workspace to track a separate budget.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create a new workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
