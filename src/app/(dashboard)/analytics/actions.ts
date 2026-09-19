"use server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { getSubcategorySpending } from "@/server/services/transaction-service";

export async function getSubcategorySpendingAction(
  workspaceId: string,
  parentCategoryId: string,
  month: number,
  year: number
) {
  await requirePermission(workspaceId, PERMISSIONS.ANALYTICS_VIEW);

  const spending = await getSubcategorySpending(workspaceId, parentCategoryId, month, year);

  return spending
    .filter((s) => s.category.id !== parentCategoryId)
    .map((s) => ({
      id: s.category.id,
      name: s.category.name,
      icon: s.category.icon,
      value: s.total,
    }));
}
