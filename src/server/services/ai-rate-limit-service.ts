import "server-only";
import { prisma } from "@/lib/db/prisma";
import { KnownError } from "@/lib/utils/safe-error-message";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = 20;

/**
 * DB-backed fixed-window rate limit, not in-memory — this app's deploy
 * model (short-lived function instances, see vercel.json) makes an
 * in-memory Map silently reset per instance/hot-reload, which would be
 * wrong rather than "simpler but still correct." The upsert is atomic at
 * the Postgres row level, so concurrent requests can't race past the limit.
 */
export async function checkAndIncrementRateLimit(userId: string): Promise<void> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);

  const window = await prisma.aiRateLimitWindow.upsert({
    where: { userId_windowStart: { userId, windowStart } },
    create: { userId, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (window.count > LIMIT) {
    const resetTime = new Date(windowStart.getTime() + WINDOW_MS);
    throw new KnownError(
      `You've reached the AI chat limit (${LIMIT} messages/hour). Try again after ${resetTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.`
    );
  }
}
