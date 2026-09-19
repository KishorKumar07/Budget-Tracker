import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const testDb = new PrismaClient({ adapter });

let counter = 0;

export function uniqueEmail(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.example.com`;
}

export async function createTestUser(prefix: string) {
  return testDb.user.create({
    data: {
      name: `Test ${prefix}`,
      email: uniqueEmail(prefix),
      passwordHash: "not-a-real-hash",
    },
  });
}

export async function createTestWorkspace(creatorId: string, permissions: string[]) {
  return testDb.workspace.create({
    data: {
      name: "Test Workspace",
      createdById: creatorId,
      members: {
        create: {
          userId: creatorId,
          permissions,
          isCreator: true,
        },
      },
    },
  });
}

export async function addMember(workspaceId: string, userId: string, permissions: string[]) {
  return testDb.workspaceMember.create({
    data: { workspaceId, userId, permissions, isCreator: false },
  });
}

export async function cleanupWorkspace(workspaceId: string) {
  await testDb.transaction.deleteMany({ where: { workspaceId } });
  await testDb.budget.deleteMany({ where: { workspaceId } });
  await testDb.category.deleteMany({ where: { workspaceId } });
  await testDb.invitation.deleteMany({ where: { workspaceId } });
  await testDb.workspaceMember.deleteMany({ where: { workspaceId } });
  await testDb.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
}

export async function cleanupUser(userId: string) {
  await testDb.user.delete({ where: { id: userId } }).catch(() => {});
}
