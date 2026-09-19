import { describe, it, expect, afterAll } from "vitest";
import { testDb, createTestUser, createTestWorkspace, addMember, cleanupWorkspace, cleanupUser } from "@/test/db";
import { createBudget, getWorkspaceBudgets } from "@/server/services/budget-service";
import { removeWorkspaceMember } from "@/server/services/workspace-service";
import { getBudgetStatus, calculateBudgetUsage } from "@/lib/calculations/finance";
import { ALL_PERMISSIONS, PERMISSIONS } from "@/lib/permissions/constants";

describe("budget over-budget detection", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("flags a category as over budget once spending exceeds the budget amount", async () => {
    const user = await createTestUser("budget-user");
    cleanup.push(() => cleanupUser(user.id));

    const workspace = await createTestWorkspace(user.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const category = await testDb.category.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        name: "Groceries",
        type: "EXPENSE",
        icon: "🛒",
        color: "#000",
      },
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await createBudget(workspace.id, { categoryId: category.id, amount: 1000, month, year });

    await testDb.transaction.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        categoryId: category.id,
        amount: 1200,
        type: "EXPENSE",
        date: now,
        paymentMethod: "CASH",
      },
    });

    const [budget] = await getWorkspaceBudgets(workspace.id, month, year);
    expect(budget.spent).toBe(1200);
    expect(calculateBudgetUsage(budget.spent, Number(budget.amount))).toBe(120);
    expect(getBudgetStatus(calculateBudgetUsage(budget.spent, Number(budget.amount)))).toBe("over");
  });

  it("rejects creating a second budget for the same category and month", async () => {
    const user = await createTestUser("budget-dup-user");
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

    const now = new Date();
    await createBudget(workspace.id, {
      categoryId: category.id,
      amount: 500,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    await expect(
      createBudget(workspace.id, {
        categoryId: category.id,
        amount: 999,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
    ).rejects.toThrow();
  });
});

describe("workspace admin succession", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("transfers creator status to the longest-standing member when the creator is removed", async () => {
    const creator = await createTestUser("succession-creator");
    const secondMember = await createTestUser("succession-second");
    cleanup.push(() => cleanupUser(creator.id), () => cleanupUser(secondMember.id));

    const workspace = await createTestWorkspace(creator.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    await addMember(workspace.id, secondMember.id, [PERMISSIONS.DASHBOARD_VIEW]);

    await removeWorkspaceMember(workspace.id, creator.id);

    const newCreatorMembership = await testDb.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: secondMember.id } },
    });
    expect(newCreatorMembership?.isCreator).toBe(true);
    expect(newCreatorMembership?.permissions).toEqual(ALL_PERMISSIONS);

    const updatedWorkspace = await testDb.workspace.findUnique({ where: { id: workspace.id } });
    expect(updatedWorkspace?.createdById).toBe(secondMember.id);
  });

  it("refuses to remove the sole remaining member of a workspace", async () => {
    const soleMember = await createTestUser("sole-member");
    cleanup.push(() => cleanupUser(soleMember.id));

    const workspace = await createTestWorkspace(soleMember.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    await expect(removeWorkspaceMember(workspace.id, soleMember.id)).rejects.toThrow();
  });
});
