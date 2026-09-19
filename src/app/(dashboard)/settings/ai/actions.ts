"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import { saveApiKeySchema, deleteApiKeySchema } from "@/lib/validations/ai";
import {
  testApiKey,
  upsertApiKey,
  deleteApiKey,
  recordValidationResult,
  getDecryptedApiKey,
} from "@/server/services/ai-key-service";
import { safeErrorMessage } from "@/lib/utils/safe-error-message";

export type ActionState = { error?: string; success?: boolean };

export async function saveApiKeyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = saveApiKeySchema.safeParse({
    provider: formData.get("provider"),
    apiKey: formData.get("apiKey"),
    label: formData.get("label") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const testResult = await testApiKey(parsed.data.provider, parsed.data.apiKey);
    if (!testResult.ok) {
      return { error: `That key didn't work: ${testResult.error}` };
    }

    await upsertApiKey(userId, parsed.data.provider, parsed.data.apiKey, parsed.data.label);
  } catch (error) {
    return { error: safeErrorMessage(error) };
  }

  revalidatePath("/settings/ai");
  return { success: true };
}

export async function deleteApiKeyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = deleteApiKeySchema.safeParse({ provider: formData.get("provider") });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  await deleteApiKey(userId, parsed.data.provider);

  revalidatePath("/settings/ai");
  return { success: true };
}

export async function testApiKeyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = deleteApiKeySchema.safeParse({ provider: formData.get("provider") });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const rawKey = await getDecryptedApiKey(userId, parsed.data.provider);
  if (!rawKey) {
    return { error: "No key saved for this provider yet." };
  }

  const result = await testApiKey(parsed.data.provider, rawKey);
  await recordValidationResult(userId, parsed.data.provider, result);

  revalidatePath("/settings/ai");
  return result.ok ? { success: true } : { error: result.error };
}
