import { NextResponse } from "next/server";
import { requireAuth, requirePermission, AuthError, ForbiddenError } from "@/lib/auth/guards";
import { PERMISSIONS, type Permission } from "@/lib/permissions/constants";
import { chatRequestSchema } from "@/lib/validations/ai";
import { getOrCreateConversation, getConversationHistory, runChatTurn } from "@/server/services/ai-service";
import { KnownError, safeErrorMessage } from "@/lib/utils/safe-error-message";

function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof KnownError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    const { membership } = await requirePermission(parsed.data.workspaceId, PERMISSIONS.AI_USE);

    const conversation = await getOrCreateConversation(parsed.data.workspaceId, userId);
    const result = await runChatTurn({
      workspaceId: parsed.data.workspaceId,
      userId,
      conversationId: conversation.id,
      userMessage: parsed.data.message,
      permissions: membership.permissions as Permission[],
    });

    return NextResponse.json({ conversationId: conversation.id, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    await requirePermission(workspaceId, PERMISSIONS.AI_USE);

    const history = await getConversationHistory(workspaceId, userId);
    return NextResponse.json(history);
  } catch (error) {
    return errorResponse(error);
  }
}
