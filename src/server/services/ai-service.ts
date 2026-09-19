import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/auth/errors";
import { KnownError } from "@/lib/utils/safe-error-message";
import type { Permission } from "@/lib/permissions/constants";
import { AI_TOOLS, findTool, type AiToolSpec, type ToolContext } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { GrokProvider } from "@/lib/ai/providers/grok-provider";
import { AiProviderError, type AiProvider, type ChatMessage, type ToolDefinition } from "@/lib/ai/provider-types";
import { getDecryptedApiKey, recordKeyUsed, recordValidationResult } from "./ai-key-service";
import { checkAndIncrementRateLimit } from "./ai-rate-limit-service";
import { getUserCurrency } from "./user-service";
import { getWorkspaceForUser } from "./workspace-service";
import type { AiProviderName as AiProviderNameType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

const geminiProvider = new GeminiProvider();
const grokProvider = new GrokProvider();

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOOL_ROUNDTRIPS = 3;

export type ProposedAction = {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  summary: string;
};

export type ChatTurnOutcome =
  | { kind: "answer"; content: string }
  | { kind: "proposal"; proposal: ProposedAction };

function toJsonSchema(tool: AiToolSpec): ToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    // "any" instead of the default "throw": some tool schemas include a
    // z.coerce.date() field, which JSON Schema has no native representation
    // for. The model only ever emits/reads plain JSON, so it always sends
    // dates as ISO strings regardless — those still parse fine through the
    // original Zod schema at execution time, which is the actual validation
    // boundary. This only affects what's DESCRIBED to the model, not what's
    // accepted.
    parameters: z.toJSONSchema(tool.zodSchema, { unrepresentable: "any" }) as Record<string, unknown>,
  };
}

/**
 * Pure permission-list check — no session/auth lookup. The caller
 * (a route handler, which already ran requireAuth/requirePermission for
 * the top-level AI_USE gate) is responsible for supplying the caller's
 * real, freshly-fetched WorkspaceMember.permissions here. This keeps the
 * fine-grained per-tool check unit-testable without mocking Auth.js.
 */
export function getAvailableTools(permissions: Permission[]): AiToolSpec[] {
  return AI_TOOLS.filter(
    (tool) => tool.requiredPermission === null || permissions.includes(tool.requiredPermission)
  );
}

function assertToolPermission(permissions: Permission[], tool: AiToolSpec) {
  if (tool.requiredPermission !== null && !permissions.includes(tool.requiredPermission)) {
    throw new ForbiddenError(
      `You do not have permission to perform this action (${tool.requiredPermission}).`
    );
  }
}

export async function getOrCreateConversation(workspaceId: string, userId: string) {
  const existing = await prisma.aiConversation.findFirst({
    where: { workspaceId, userId },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.aiConversation.create({ data: { workspaceId, userId } });
}

export async function getConversationHistory(workspaceId: string, userId: string) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { workspaceId, userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      actions: true,
    },
  });

  if (!conversation) return { conversationId: null, messages: [] };

  const confirmedProposalIds = new Set(
    conversation.actions.map((a) => (a.arguments as { __proposalId?: string }).__proposalId).filter(Boolean)
  );

  return {
    conversationId: conversation.id,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      proposedAction: m.proposedAction as ProposedAction | null,
      confirmed: m.proposedAction
        ? confirmedProposalIds.has((m.proposedAction as ProposedAction).id)
        : false,
      createdAt: m.createdAt,
    })),
  };
}

async function callProvider(
  provider: AiProvider,
  providerName: AiProviderNameType,
  userId: string,
  messages: ChatMessage[],
  toolDefs: ToolDefinition[]
) {
  const apiKey = await getDecryptedApiKey(userId, providerName);
  if (!apiKey) return null;

  try {
    const result = await provider.sendChatTurn(messages, toolDefs, apiKey);
    await recordKeyUsed(userId, providerName);
    await recordValidationResult(userId, providerName, { ok: true });
    return result;
  } catch (error) {
    const message = error instanceof AiProviderError ? error.message : "Provider request failed.";
    await recordValidationResult(userId, providerName, { ok: false, error: message });
    throw error;
  }
}

/**
 * Tries Gemini first; on ANY failure (network, non-2xx, malformed
 * response) falls back to Grok if the user has a Grok key configured.
 * Neither key configured, or both fail, surfaces a clear KnownError.
 */
async function sendTurnWithFallback(
  userId: string,
  messages: ChatMessage[],
  toolDefs: ToolDefinition[],
  providerOverrides?: { gemini?: AiProvider; grok?: AiProvider }
) {
  const gemini = providerOverrides?.gemini ?? geminiProvider;
  const grok = providerOverrides?.grok ?? grokProvider;

  const hasGemini = (await getDecryptedApiKey(userId, "GEMINI")) !== null;
  const hasGrok = (await getDecryptedApiKey(userId, "GROK")) !== null;

  if (!hasGemini && !hasGrok) {
    throw new KnownError("Add a Gemini or Grok API key in Settings → AI Assistant to start chatting.");
  }

  if (hasGemini) {
    try {
      const result = await callProvider(gemini, "GEMINI", userId, messages, toolDefs);
      if (result) return { result, provider: "GEMINI" as const };
    } catch (error) {
      if (!hasGrok) {
        const message = error instanceof AiProviderError ? error.message : "Gemini is unavailable.";
        throw new KnownError(
          `Gemini couldn't be reached right now (${message}) and no Grok key is configured as a backup. Try again shortly, or add a Grok key in Settings.`
        );
      }
      // fall through to Grok
    }
  }

  if (hasGrok) {
    try {
      const result = await callProvider(grok, "GROK", userId, messages, toolDefs);
      if (result) return { result, provider: "GROK" as const };
    } catch (error) {
      const message = error instanceof AiProviderError ? error.message : "Grok is unavailable.";
      if (hasGemini) {
        throw new KnownError(`Both your Gemini and Grok keys failed. Grok's last error: ${message}`);
      }
      throw new KnownError(`Grok couldn't be reached right now (${message}). Try again shortly.`);
    }
  }

  throw new KnownError("No AI provider is currently reachable. Try again shortly.");
}

export async function runChatTurn(params: {
  workspaceId: string;
  userId: string;
  conversationId: string;
  userMessage: string;
  permissions: Permission[];
  /** Test-only: inject fake providers instead of real Gemini/Grok. */
  providerOverrides?: { gemini?: AiProvider; grok?: AiProvider };
}): Promise<ChatTurnOutcome> {
  const { workspaceId, userId, conversationId, userMessage, permissions, providerOverrides } = params;

  await checkAndIncrementRateLimit(userId);

  const tools = getAvailableTools(permissions);
  const toolDefs = tools.map(toJsonSchema);

  const [workspace, currency, historyRows] = await Promise.all([
    getWorkspaceForUser(workspaceId, userId),
    getUserCurrency(userId),
    prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    }),
  ]);

  const systemPrompt = buildSystemPrompt(workspace.workspace.name, currency);

  await prisma.aiMessage.create({
    data: { conversationId, role: "USER", content: userMessage },
  });
  await prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyRows.map((row): ChatMessage => {
      if (row.role === "USER") return { role: "user", content: row.content };
      return { role: "assistant", content: row.content };
    }),
    { role: "user", content: userMessage },
  ];

  const ctx: ToolContext = { workspaceId, userId, currency };

  for (let round = 0; round < MAX_TOOL_ROUNDTRIPS; round++) {
    const { result, provider } = await sendTurnWithFallback(userId, messages, toolDefs, providerOverrides);

    if (result.toolCalls.length === 0) {
      await prisma.aiMessage.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          content: result.content ?? "",
          providerUsed: provider,
        },
      });
      return { kind: "answer", content: result.content ?? "" };
    }

    const call = result.toolCalls[0];
    const tool = findTool(call.name);

    if (!tool) {
      // Model hallucinated a tool that isn't in the whitelist — refuse cleanly.
      const content = "I can't do that here — that action isn't available to me.";
      await prisma.aiMessage.create({
        data: { conversationId, role: "ASSISTANT", content, providerUsed: provider },
      });
      return { kind: "answer", content };
    }

    // Defense in depth: re-check permission even though tools were already
    // filtered to the caller's permissions before being offered to the model.
    assertToolPermission(permissions, tool);

    const parsedArgs = tool.zodSchema.safeParse(call.arguments);
    if (!parsedArgs.success) {
      const content = "I tried to do that but the details didn't quite make sense — could you rephrase?";
      await prisma.aiMessage.create({
        data: { conversationId, role: "ASSISTANT", content, providerUsed: provider },
      });
      return { kind: "answer", content };
    }

    if (tool.kind === "read") {
      const readResult = await tool.execute(ctx, parsedArgs.data as Record<string, unknown>);
      messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });
      messages.push({
        role: "tool",
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify(readResult),
      });
      continue; // loop back to the same provider with the tool result appended
    }

    // write tool -> build a proposal, never execute here
    const proposal: ProposedAction = {
      id: randomUUID(),
      toolName: tool.name,
      arguments: parsedArgs.data as Record<string, unknown>,
      summary: tool.summarize(parsedArgs.data as Record<string, unknown>, undefined),
    };

    await prisma.aiMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: result.content ?? proposal.summary,
        proposedAction: proposal as unknown as Prisma.InputJsonValue,
        providerUsed: provider,
      },
    });

    return { kind: "proposal", proposal };
  }

  const content = "I wasn't able to finish that — could you try rephrasing your request?";
  await prisma.aiMessage.create({ data: { conversationId, role: "ASSISTANT", content } });
  return { kind: "answer", content };
}

export async function confirmProposedAction(params: {
  workspaceId: string;
  userId: string;
  conversationId: string;
  proposalId: string;
  permissions: Permission[];
}): Promise<{ resultSummary: string; target?: string }> {
  const { workspaceId, userId, conversationId, proposalId, permissions } = params;

  const conversation = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    include: { actions: true },
  });

  if (!conversation || conversation.workspaceId !== workspaceId || conversation.userId !== userId) {
    throw new ForbiddenError("This conversation does not belong to you.");
  }

  // Idempotency: if this exact proposal was already confirmed, return the
  // prior result rather than executing the mutation a second time.
  const existingAction = conversation.actions.find(
    (a) => (a.arguments as { __proposalId?: string }).__proposalId === proposalId
  );
  if (existingAction) {
    const tool = findTool(existingAction.toolName);
    return { resultSummary: existingAction.resultSummary, target: tool?.target };
  }

  const messages = await prisma.aiMessage.findMany({ where: { conversationId } });
  const messageWithProposal = messages.find(
    (m) => m.proposedAction && (m.proposedAction as ProposedAction).id === proposalId
  );

  if (!messageWithProposal || !messageWithProposal.proposedAction) {
    throw new KnownError("This proposal is no longer available.");
  }

  const proposal = messageWithProposal.proposedAction as ProposedAction;
  const tool = findTool(proposal.toolName);
  if (!tool) {
    throw new KnownError("This action is no longer available.");
  }

  // Re-validate and re-authorize — never trust round-tripped JSON, and
  // permissions may have changed between propose and confirm (the caller
  // re-fetches `permissions` fresh from the DB before calling this).
  assertToolPermission(permissions, tool);
  const parsedArgs = tool.zodSchema.parse(proposal.arguments);

  const currency = await getUserCurrency(userId);
  const ctx: ToolContext = { workspaceId, userId, currency };

  const result = await tool.execute(ctx, parsedArgs as Record<string, unknown>);
  const resultSummary = tool.summarize(parsedArgs as Record<string, unknown>, result);

  await prisma.aiConfirmedAction.create({
    data: {
      conversationId,
      workspaceId,
      userId,
      toolName: tool.name,
      arguments: { ...(parsedArgs as object), __proposalId: proposalId } as unknown as Prisma.InputJsonValue,
      resultSummary,
    },
  });

  await prisma.aiMessage.create({
    data: { conversationId, role: "ASSISTANT", content: `Confirmed: ${resultSummary}` },
  });

  return { resultSummary, target: tool.target };
}
