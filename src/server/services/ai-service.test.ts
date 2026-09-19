import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";
import { testDb, createTestUser, createTestWorkspace, cleanupWorkspace, cleanupUser } from "@/test/db";
import { ALL_PERMISSIONS } from "@/lib/permissions/constants";
import type { AiProvider, ChatMessage, ChatTurnResult, ToolDefinition } from "@/lib/ai/provider-types";
import { getDefaultCategories } from "@/lib/categories/default-categories";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

/** A scripted fake provider — never calls a real Gemini/Grok endpoint. */
class FakeProvider implements AiProvider {
  readonly name: "gemini" | "grok";
  private script: ChatTurnResult[];
  private callCount = 0;

  constructor(name: "gemini" | "grok", script: ChatTurnResult[]) {
    this.name = name;
    this.script = script;
  }

  async sendChatTurn(_messages: ChatMessage[], _tools: ToolDefinition[], _apiKey: string): Promise<ChatTurnResult> {
    const step = this.script[Math.min(this.callCount, this.script.length - 1)];
    this.callCount++;
    return step;
  }
}

async function setupWorkspaceWithCategory() {
  const owner = await createTestUser("ai-svc-owner");
  const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);

  const defaults = getDefaultCategories();
  const groceries = defaults.find((c) => c.name === "Groceries")!;
  const category = await testDb.category.create({
    data: {
      workspaceId: workspace.id,
      createdById: owner.id,
      name: groceries.name,
      type: groceries.type,
      icon: groceries.icon,
      color: groceries.color,
      isDefault: true,
    },
  });

  return { owner, workspace, category };
}

describe("runChatTurn", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("a direct answer (no tool call) writes no DB row beyond the messages", async () => {
    const { owner, workspace } = await setupWorkspaceWithCategory();
    cleanup.push(() => cleanupUser(owner.id), () => cleanupWorkspace(workspace.id));

    await testDb.aiApiKey.create({
      data: {
        userId: owner.id,
        provider: "GEMINI",
        encryptedKey: (await import("@/lib/crypto/encryption")).encrypt("fake-key"),
      },
    });

    const { runChatTurn, getOrCreateConversation } = await import("@/server/services/ai-service");
    const conversation = await getOrCreateConversation(workspace.id, owner.id);

    const fakeGemini = new FakeProvider("gemini", [{ content: "You spent nothing yet.", toolCalls: [] }]);

    const outcome = await runChatTurn({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      userMessage: "How much have I spent?",
      permissions: ALL_PERMISSIONS,
      providerOverrides: { gemini: fakeGemini },
    });

    expect(outcome.kind).toBe("answer");
    if (outcome.kind === "answer") expect(outcome.content).toBe("You spent nothing yet.");

    const confirmedActions = await testDb.aiConfirmedAction.count({ where: { conversationId: conversation.id } });
    expect(confirmedActions).toBe(0);

    const transactionCount = await testDb.transaction.count({ where: { workspaceId: workspace.id } });
    expect(transactionCount).toBe(0);
  });

  it("a write tool call produces a proposal and creates NO transaction until confirmed", async () => {
    const { owner, workspace, category } = await setupWorkspaceWithCategory();
    cleanup.push(() => cleanupUser(owner.id), () => cleanupWorkspace(workspace.id));

    await testDb.aiApiKey.create({
      data: {
        userId: owner.id,
        provider: "GEMINI",
        encryptedKey: (await import("@/lib/crypto/encryption")).encrypt("fake-key"),
      },
    });

    const { runChatTurn, confirmProposedAction, getOrCreateConversation } = await import(
      "@/server/services/ai-service"
    );
    const conversation = await getOrCreateConversation(workspace.id, owner.id);

    const fakeGemini = new FakeProvider("gemini", [
      {
        content: "I'll add that expense.",
        toolCalls: [
          {
            id: "call-1",
            name: "create_transaction",
            arguments: {
              amount: 500,
              type: "EXPENSE",
              categoryId: category.id,
              date: new Date().toISOString(),
              paymentMethod: "CASH",
            },
          },
        ],
      },
    ]);

    const outcome = await runChatTurn({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      userMessage: "Add a 500 rupee grocery expense",
      permissions: ALL_PERMISSIONS,
      providerOverrides: { gemini: fakeGemini },
    });

    expect(outcome.kind).toBe("proposal");
    if (outcome.kind !== "proposal") throw new Error("expected proposal");

    // Nothing written yet.
    let transactionCount = await testDb.transaction.count({ where: { workspaceId: workspace.id } });
    expect(transactionCount).toBe(0);

    const confirmResult = await confirmProposedAction({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      proposalId: outcome.proposal.id,
      permissions: ALL_PERMISSIONS,
    });

    expect(confirmResult.resultSummary).toContain("500");

    transactionCount = await testDb.transaction.count({ where: { workspaceId: workspace.id } });
    expect(transactionCount).toBe(1);

    const confirmedActions = await testDb.aiConfirmedAction.count({ where: { conversationId: conversation.id } });
    expect(confirmedActions).toBe(1);

    // Confirming the SAME proposal again does not create a second transaction.
    await confirmProposedAction({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      proposalId: outcome.proposal.id,
      permissions: ALL_PERMISSIONS,
    });

    transactionCount = await testDb.transaction.count({ where: { workspaceId: workspace.id } });
    expect(transactionCount).toBe(1);
  });

  it("a read tool call executes immediately and feeds the result back for a natural-language answer", async () => {
    const { owner, workspace } = await setupWorkspaceWithCategory();
    cleanup.push(() => cleanupUser(owner.id), () => cleanupWorkspace(workspace.id));

    await testDb.aiApiKey.create({
      data: {
        userId: owner.id,
        provider: "GEMINI",
        encryptedKey: (await import("@/lib/crypto/encryption")).encrypt("fake-key"),
      },
    });

    const { runChatTurn, getOrCreateConversation } = await import("@/server/services/ai-service");
    const conversation = await getOrCreateConversation(workspace.id, owner.id);
    const now = new Date();

    const fakeGemini = new FakeProvider("gemini", [
      {
        content: null,
        toolCalls: [
          {
            id: "call-1",
            name: "get_spending_summary",
            arguments: { month: now.getMonth() + 1, year: now.getFullYear() },
          },
        ],
      },
      { content: "You haven't spent anything this month.", toolCalls: [] },
    ]);

    const outcome = await runChatTurn({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      userMessage: "How much have I spent this month?",
      permissions: ALL_PERMISSIONS,
      providerOverrides: { gemini: fakeGemini },
    });

    expect(outcome.kind).toBe("answer");
    if (outcome.kind === "answer") {
      expect(outcome.content).toBe("You haven't spent anything this month.");
    }
  });

  it("a jailbreak attempt targeting a transaction from a different workspace is rejected by the underlying service, not by the prompt", async () => {
    const { owner, workspace } = await setupWorkspaceWithCategory();
    const other = await setupWorkspaceWithCategory();
    cleanup.push(
      () => cleanupUser(owner.id),
      () => cleanupWorkspace(workspace.id),
      () => cleanupUser(other.owner.id),
      () => cleanupWorkspace(other.workspace.id)
    );

    // A real transaction that belongs to a DIFFERENT workspace.
    const foreignTransaction = await testDb.transaction.create({
      data: {
        workspaceId: other.workspace.id,
        createdById: other.owner.id,
        categoryId: other.category.id,
        amount: 999,
        type: "EXPENSE",
        date: new Date(),
        paymentMethod: "OTHER",
      },
    });

    await testDb.aiApiKey.create({
      data: {
        userId: owner.id,
        provider: "GEMINI",
        encryptedKey: (await import("@/lib/crypto/encryption")).encrypt("fake-key"),
      },
    });

    const { runChatTurn, confirmProposedAction, getOrCreateConversation } = await import(
      "@/server/services/ai-service"
    );
    const conversation = await getOrCreateConversation(workspace.id, owner.id);

    // Simulated jailbroken model tries to delete a transaction that
    // belongs to a workspace the caller is operating in `workspace.id`,
    // but the transaction id actually belongs to `other.workspace.id`.
    const fakeGemini = new FakeProvider("gemini", [
      {
        content: "Deleting that.",
        toolCalls: [{ id: "call-1", name: "delete_transaction", arguments: { transactionId: foreignTransaction.id } }],
      },
    ]);

    const outcome = await runChatTurn({
      workspaceId: workspace.id,
      userId: owner.id,
      conversationId: conversation.id,
      userMessage: "delete transaction X",
      permissions: ALL_PERMISSIONS,
      providerOverrides: { gemini: fakeGemini },
    });

    expect(outcome.kind).toBe("proposal");
    if (outcome.kind !== "proposal") throw new Error("expected proposal");

    // The service-layer ownership check inside deleteTransaction must
    // reject this at confirm time, regardless of what the model asked for.
    await expect(
      confirmProposedAction({
        workspaceId: workspace.id,
        userId: owner.id,
        conversationId: conversation.id,
        proposalId: outcome.proposal.id,
        permissions: ALL_PERMISSIONS,
      })
    ).rejects.toThrow();

    const stillExists = await testDb.transaction.findUnique({ where: { id: foreignTransaction.id } });
    expect(stillExists).not.toBeNull();
  });
});
