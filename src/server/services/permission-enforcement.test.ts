import { describe, it, expect, afterAll } from "vitest";
import { testDb, createTestUser, createTestWorkspace, addMember, cleanupWorkspace, cleanupUser } from "@/test/db";
import { updateMemberPermissions } from "@/server/services/workspace-service";
import { ForbiddenError } from "@/lib/auth/errors";
import { PERMISSIONS, ALL_PERMISSIONS } from "@/lib/permissions/constants";

describe("permission escalation prevention", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("rejects a member granting a permission they don't hold themselves", async () => {
    const owner = await createTestUser("perm-owner");
    const limitedMember = await createTestUser("perm-limited");
    const target = await createTestUser("perm-target");
    cleanup.push(() => cleanupUser(owner.id), () => cleanupUser(limitedMember.id), () => cleanupUser(target.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const limitedPermissions = [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.MEMBER_UPDATE_PERMISSIONS];
    await addMember(workspace.id, limitedMember.id, limitedPermissions);
    await addMember(workspace.id, target.id, [PERMISSIONS.DASHBOARD_VIEW]);

    // limitedMember only has DASHBOARD_VIEW + MEMBER_UPDATE_PERMISSIONS,
    // but tries to grant `target` full access — must be rejected.
    await expect(
      updateMemberPermissions(workspace.id, target.id, ALL_PERMISSIONS, limitedPermissions)
    ).rejects.toBeInstanceOf(ForbiddenError);

    // Confirm the target's permissions were not changed in the DB.
    const targetMembership = await testDb.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: target.id } },
    });
    expect(targetMembership?.permissions).toEqual([PERMISSIONS.DASHBOARD_VIEW]);
  });

  it("allows a member to grant a subset of their own permissions", async () => {
    const owner = await createTestUser("perm-owner-2");
    const limitedMember = await createTestUser("perm-limited-2");
    const target = await createTestUser("perm-target-2");
    cleanup.push(() => cleanupUser(owner.id), () => cleanupUser(limitedMember.id), () => cleanupUser(target.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    const limitedPermissions = [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.TRANSACTION_VIEW,
      PERMISSIONS.MEMBER_UPDATE_PERMISSIONS,
    ];
    await addMember(workspace.id, limitedMember.id, limitedPermissions);
    await addMember(workspace.id, target.id, []);

    const grant = [PERMISSIONS.DASHBOARD_VIEW];
    await updateMemberPermissions(workspace.id, target.id, grant, limitedPermissions);

    const targetMembership = await testDb.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: target.id } },
    });
    expect(targetMembership?.permissions).toEqual(grant);
  });

  it("rejects editing the workspace creator's permissions even by another privileged member", async () => {
    const owner = await createTestUser("perm-owner-3");
    const privilegedMember = await createTestUser("perm-privileged-3");
    cleanup.push(() => cleanupUser(owner.id), () => cleanupUser(privilegedMember.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    await addMember(workspace.id, privilegedMember.id, ALL_PERMISSIONS);

    await expect(
      updateMemberPermissions(workspace.id, owner.id, [PERMISSIONS.DASHBOARD_VIEW], ALL_PERMISSIONS)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects updating permissions for someone who isn't a member of the workspace", async () => {
    const owner = await createTestUser("perm-owner-4");
    const stranger = await createTestUser("perm-stranger-4");
    cleanup.push(() => cleanupUser(owner.id), () => cleanupUser(stranger.id));

    const workspace = await createTestWorkspace(owner.id, ALL_PERMISSIONS);
    cleanup.push(() => cleanupWorkspace(workspace.id));

    await expect(
      updateMemberPermissions(workspace.id, stranger.id, [PERMISSIONS.DASHBOARD_VIEW], ALL_PERMISSIONS)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
