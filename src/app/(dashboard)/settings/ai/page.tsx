import { requireAuth } from "@/lib/auth/guards";
import { listApiKeyStatuses } from "@/server/services/ai-key-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AiKeysForm } from "./ai-keys-form";

export default async function AiSettingsPage() {
  const { userId } = await requireAuth();
  const statuses = await listApiKeyStatuses(userId);

  const geminiStatus = statuses.find((s) => s.provider === "GEMINI") ?? null;
  const grokStatus = statuses.find((s) => s.provider === "GROK") ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="AI Assistant"
        description="Connect your own Gemini or Grok API key to chat with the budget assistant."
      />
      <div className="p-4 md:p-8">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <AiKeysForm geminiStatus={geminiStatus} grokStatus={grokStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
