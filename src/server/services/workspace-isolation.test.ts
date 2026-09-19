import { describe, it, expect, afterAll } from "vitest";
import { testDb, createTestUser, createTestWorkspace, cleanupWorkspace, cleanupUser } from "@/test/db";
import { createTransaction, getTransactionForWorkspace } from "@/server/services/transaction-service";
import { ForbiddenError } from "@/lib/auth/errors";
import { ALL_PERMISSIONS } from "@/lib/permissions/constants";

describe("workspace data isolation", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("rejects fetching a transaction that belongs to a different workspace", async () => {
    const userA = await createTestUser("owner-a");
    const userB = await createTestUser("owner-b");
    cleanup.push(() => cleanupUser(userA.id), () => cleanupUser(userB.id));

    const workspaceA = await createTestWorkspace(userA.id, ALL_PERMISSIONS);
    const workspaceB = await createTestWorkspace(userB.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspaceA.id), () => cleanupWorkspace(workspaceB.id));

    const categoryA = await testDb.category.create({
      data: {
        workspaceId: workspaceA.id,
        createdById: userA.id,
        name: "Groceries",
        type: "EXPENSE",
        icon: "🛒",
        color: "#000",
      },
    });

    const transactionInA = await createTransaction(workspaceA.id, userA.id, {
      amount: 500,
      type: "EXPENSE",
      categoryId: categoryA.id,
      date: new Date(),
      paymentMethod: "CASH",
    });

    // User B (workspace B) tries to read a transaction that lives in workspace A.
    // This is the core IDOR check: passing workspace B's id must fail even
    // though the transaction id itself is valid.
    await expect(
      getTransactionForWorkspace(workspaceB.id, transactionInA.id)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects creating a transaction against a category from a different workspace", async () => {
    const userA = await createTestUser("cat-owner-a");
    const userB = await createTestUser("cat-owner-b");
    cleanup.push(() => cleanupUser(userA.id), () => cleanupUser(userB.id));

    const workspaceA = await createTestWorkspace(userA.id, ALL_PERMISSIONS);
    const workspaceB = await createTestWorkspace(userB.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspaceA.id), () => cleanupWorkspace(workspaceB.id));

    const categoryInA = await testDb.category.create({
      data: {
        workspaceId: workspaceA.id,
        createdById: userA.id,
        name: "Rent",
        type: "EXPENSE",
        icon: "🏠",
        color: "#000",
      },
    });

    // User B attempts to create a transaction in workspace B but points
    // categoryId at a category that actually belongs to workspace A.
    await expect(
      createTransaction(workspaceB.id, userB.id, {
        amount: 1000,
        type: "EXPENSE",
        categoryId: categoryInA.id,
        date: new Date(),
        paymentMethod: "CASH",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows fetching a transaction when the workspace matches", async () => {
    const user = await createTestUser("valid-owner");
    cleanup.push(() => cleanupUser(user.id));

    const workspace = await createTestWorkspace(user.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const category = await testDb.category.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        name: "Fuel",
        type: "EXPENSE",
        icon: "⛽",
        color: "#000",
      },
    });

    const created = await createTransaction(workspace.id, user.id, {
      amount: 200,
      type: "EXPENSE",
      categoryId: category.id,
      date: new Date(),
      paymentMethod: "CASH",
    });

    const fetched = await getTransactionForWorkspace(workspace.id, created.id);
    expect(fetched.id).toBe(created.id);
  });
});
