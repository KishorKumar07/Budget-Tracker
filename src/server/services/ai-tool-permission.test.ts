import { describe, it, expect, afterAll } from "vitest";
import { testDb, createTestUser, createTestWorkspace, cleanupWorkspace, cleanupUser } from "@/test/db";
import { PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions/constants";
import { getAvailableTools, confirmProposedAction } from "@/server/services/ai-service";
import { AI_TOOLS } from "@/lib/ai/tools";
import { ForbiddenError } from "@/lib/auth/errors";

describe("getAvailableTools", () => {
  it("excludes a tool the caller's permissions don't include", () => {
    const tools = getAvailableTools([PERMISSIONS.DASHBOARD_VIEW]);
    expect(tools.find((t) => t.name === "create_transaction")).toBeUndefined();
    expect(tools.find((t) => t.name === "delete_budget")).toBeUndefined();
  });

  it("includes a tool once its required permission is granted", () => {
    const tools = getAvailableTools([PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.TRANSACTION_CREATE]);
    expect(tools.find((t) => t.name === "create_transaction")).toBeDefined();
  });

  it("includes permission-less tools (categories) for any workspace member", () => {
    const tools = getAvailableTools([]);
    expect(tools.find((t) => t.name === "create_category")).toBeDefined();
  });

  it("with ALL_PERMISSIONS includes every tool in the registry", () => {
    const tools = getAvailableTools(ALL_PERMISSIONS);
    expect(tools).toHaveLength(AI_TOOLS.length);
  });

  it("with no permissions still exposes only the permission-less tools", () => {
    const tools = getAvailableTools([]);
    const permissionLessCount = AI_TOOLS.filter((t) => t.requiredPermission === null).length;
    expect(tools).toHaveLength(permissionLessCount);
  });
});

describe("confirmProposedAction — permission re-check at confirm time", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("rejects confirming a proposal if the caller's permission was revoked since it was proposed", async () => {
    const owner = await createTestUser("ai-perm-owner");
    cleanup.push(() => cleanupUser(owner.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const conversation = await testDb.aiConversation.create({
      data: { workspaceId: workspace.id, userId: owner.id },
    });

    const proposalId = "test-proposal-1";
    await testDb.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: "proposal",
        proposedAction: {
          id: proposalId,
          toolName: "create_transaction",
          summary: "Create expense",
          arguments: {
            amount: 100,
            type: "EXPENSE",
            categoryId: "nonexistent-category",
            date: new Date().toISOString(),
            paymentMethod: "OTHER",
          },
        },
      },
    });

    // Confirm attempted with a permission set that lacks TRANSACTION_CREATE
    // (as if it had been revoked between propose and confirm) — must be
    // rejected before the underlying mutation is ever attempted.
    await expect(
      confirmProposedAction({
        workspaceId: workspace.id,
        userId: owner.id,
        conversationId: conversation.id,
        proposalId,
        permissions: [PERMISSIONS.DASHBOARD_VIEW],
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    const confirmedActions = await testDb.aiConfirmedAction.findMany({ where: { conversationId: conversation.id } });
    expect(confirmedActions).toHaveLength(0);
  });

  it("rejects confirming a proposal that belongs to a different conversation/user", async () => {
    const owner = await createTestUser("ai-perm-owner-2");
    const stranger = await createTestUser("ai-perm-stranger-2");
    cleanup.push(() => cleanupUser(owner.id), () => cleanupUser(stranger.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const conversation = await testDb.aiConversation.create({
      data: { workspaceId: workspace.id, userId: owner.id },
    });

    await expect(
      confirmProposedAction({
        workspaceId: workspace.id,
        userId: stranger.id, // not this conversation's owner
        conversationId: conversation.id,
        proposalId: "whatever",
        permissions: ALL_PERMISSIONS,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
