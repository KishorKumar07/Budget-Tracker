import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth, requirePermission, AuthError, ForbiddenError } from "@/lib/auth/guards";
import { PERMISSIONS, type Permission } from "@/lib/permissions/constants";
import { confirmRequestSchema } from "@/lib/validations/ai";
import { confirmProposedAction } from "@/server/services/ai-service";
import { KnownError, safeErrorMessage } from "@/lib/utils/safe-error-message";

const TARGET_PATHS: Record<string, string[]> = {
  transactions: ["/transactions", "/dashboard"],
  categories: ["/settings/categories", "/transactions"],
  budgets: ["/budgets", "/dashboard"],
};

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json().catch(() => null);
    const parsed = confirmRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    const { membership } = await requirePermission(parsed.data.workspaceId, PERMISSIONS.AI_USE);

    const result = await confirmProposedAction({
      ...parsed.data,
      userId,
      permissions: membership.permissions as Permission[],
    });

    for (const path of TARGET_PATHS[result.target ?? ""] ?? []) {
      revalidatePath(path);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof KnownError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
  }
}
