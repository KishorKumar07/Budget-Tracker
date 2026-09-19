import { describe, it, expect, afterAll } from "vitest";
import { testDb, createTestUser, cleanupUser } from "@/test/db";
import { checkAndIncrementRateLimit } from "@/server/services/ai-rate-limit-service";
import { KnownError } from "@/lib/utils/safe-error-message";

describe("checkAndIncrementRateLimit", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
    await testDb.$disconnect();
  });

  it("allows up to the limit and rejects the next call in the same window", async () => {
    const user = await createTestUser("ai-rate-limit");
    cleanup.push(() => cleanupUser(user.id));
    cleanup.push(async () => { await testDb.aiRateLimitWindow.deleteMany({ where: { userId: user.id } }); });

    for (let i = 0; i < 20; i++) {
      await expect(checkAndIncrementRateLimit(user.id)).resolves.toBeUndefined();
    }

    await expect(checkAndIncrementRateLimit(user.id)).rejects.toBeInstanceOf(KnownError);
  });

  it("does not let concurrent requests exceed the limit", async () => {
    const user = await createTestUser("ai-rate-limit-concurrent");
    cleanup.push(() => cleanupUser(user.id));
    cleanup.push(async () => { await testDb.aiRateLimitWindow.deleteMany({ where: { userId: user.id } }); });

    const results = await Promise.allSettled(
      Array.from({ length: 25 }, () => checkAndIncrementRateLimit(user.id))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    expect(succeeded).toBe(20);
    expect(failed).toBe(5);
  });

  it("a fresh window (different user) starts at zero", async () => {
    const user = await createTestUser("ai-rate-limit-fresh");
    cleanup.push(() => cleanupUser(user.id));
    cleanup.push(async () => { await testDb.aiRateLimitWindow.deleteMany({ where: { userId: user.id } }); });

    await expect(checkAndIncrementRateLimit(user.id)).resolves.toBeUndefined();
  });
});
