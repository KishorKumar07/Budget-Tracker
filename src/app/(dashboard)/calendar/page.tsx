import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getUserCurrency } from "@/server/services/user-service";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { getMonthTransactionsByDay } from "@/server/services/transaction-service";
import { getWorkspaceMemberCount } from "@/server/services/workspace-service";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "@/components/layout/month-selector";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const { user } = await requireAuth();
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const permissions = active.membership.permissions;
  if (!permissions.includes(PERMISSIONS.TRANSACTION_VIEW)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const month = typeof params.month === "string" ? Number(params.month) : now.getMonth() + 1;
  const year = typeof params.year === "string" ? Number(params.year) : now.getFullYear();

  const workspaceId = active.workspace.id;

  const [currency, byDay, memberCount] = await Promise.all([
    getUserCurrency(user.id),
    getMonthTransactionsByDay(workspaceId, month, year),
    getWorkspaceMemberCount(workspaceId),
  ]);

  const days = Array.from(byDay.entries()).map(([day, transactions]) => {
    const income = transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);
    const savings = transactions.filter((t) => t.type === "SAVINGS").reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      day,
      income,
      expense,
      savings,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount.toString(),
        type: t.type,
        description: t.description,
        date: t.date.toISOString(),
        paymentMethod: t.paymentMethod,
        category: { id: t.category.id, name: t.category.name, icon: t.category.icon, color: t.category.color },
        createdBy: { id: t.createdBy.id, name: t.createdBy.name },
      })),
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Calendar" description="Browse transactions by day." />

      <div className="flex flex-col gap-4 p-4 md:p-8">
        <MonthSelector month={month} year={year} />

        <CalendarClient
          month={month}
          year={year}
          days={days}
          currency={currency}
          showCreatedBy={memberCount > 1}
        />
      </div>
    </div>
  );
}
