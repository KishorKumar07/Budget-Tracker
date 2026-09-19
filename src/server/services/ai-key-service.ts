import "server-only";
import { prisma } from "@/lib/db/prisma";
import { encrypt, decrypt } from "@/lib/crypto/encryption";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { GrokProvider } from "@/lib/ai/providers/grok-provider";
import type { AiProviderName } from "@/generated/prisma/client";

const providers = {
  GEMINI: new GeminiProvider(),
  GROK: new GrokProvider(),
} as const;

export async function getDecryptedApiKey(userId: string, provider: AiProviderName): Promise<string | null> {
  const row = await prisma.aiApiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!row) return null;
  return decrypt(row.encryptedKey);
}

export async function testApiKey(
  provider: AiProviderName,
  rawKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await providers[provider].sendChatTurn(
      [{ role: "user", content: "Reply with the single word: ok" }],
      [],
      rawKey
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Key validation failed." };
  }
}

export async function upsertApiKey(
  userId: string,
  provider: AiProviderName,
  rawKey: string,
  label?: string
): Promise<void> {
  const encryptedKey = encrypt(rawKey);

  await prisma.aiApiKey.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, encryptedKey, label, lastValidatedAt: new Date(), lastValidationError: null },
    update: { encryptedKey, label, lastValidatedAt: new Date(), lastValidationError: null },
  });
}

export async function deleteApiKey(userId: string, provider: AiProviderName): Promise<void> {
  await prisma.aiApiKey.deleteMany({ where: { userId, provider } });
}

export async function recordValidationResult(
  userId: string,
  provider: AiProviderName,
  result: { ok: true } | { ok: false; error: string }
): Promise<void> {
  await prisma.aiApiKey.updateMany({
    where: { userId, provider },
    data: result.ok
      ? { lastValidatedAt: new Date(), lastValidationError: null }
      : { lastValidationError: result.error },
  });
}

export async function recordKeyUsed(userId: string, provider: AiProviderName): Promise<void> {
  await prisma.aiApiKey.updateMany({ where: { userId, provider }, data: { lastUsedAt: new Date() } });
}

export async function listApiKeyStatuses(userId: string) {
  const rows = await prisma.aiApiKey.findMany({
    where: { userId },
    select: {
      provider: true,
      label: true,
      lastUsedAt: true,
      lastValidatedAt: true,
      lastValidationError: true,
    },
  });
  return rows;
}

export async function hasAnyAiKeyConfigured(userId: string): Promise<boolean> {
  const count = await prisma.aiApiKey.count({ where: { userId } });
  return count > 0;
}
