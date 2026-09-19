import { redirect } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace/current-workspace";
import { getAllWorkspaceCategoriesWithUsage } from "@/server/services/category-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryRow } from "@/components/categories/category-row";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";

export default async function CategoriesSettingsPage() {
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding/workspace");

  const categories = await getAllWorkspaceCategoriesWithUsage(active.workspace.id);

  const topLevel = categories.filter((c) => !c.parentId);
  const subsByParent = new Map<string, typeof categories>();
  for (const c of categories) {
    if (!c.parentId) continue;
    const list = subsByParent.get(c.parentId) ?? [];
    list.push(c);
    subsByParent.set(c.parentId, list);
  }

  const expense = topLevel.filter((c) => c.type === "EXPENSE");
  const income = topLevel.filter((c) => c.type === "INCOME");
  const savings = topLevel.filter((c) => c.type === "SAVINGS");

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Categories"
        description="Manage your workspace's expense and income categories."
        action={<AddCategoryDialog workspaceId={active.workspace.id} />}
      />

      <div className="flex flex-col gap-6 p-4 md:p-8">
        <CategoryGroup
          title="Expense Categories"
          categories={expense}
          subsByParent={subsByParent}
          workspaceId={active.workspace.id}
        />
        <CategoryGroup
          title="Income Categories"
          categories={income}
          subsByParent={subsByParent}
          workspaceId={active.workspace.id}
        />
        <CategoryGroup
          title="Savings Categories"
          categories={savings}
          subsByParent={subsByParent}
          workspaceId={active.workspace.id}
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  subsByParent,
  workspaceId,
}: {
  title: string;
  categories: Awaited<ReturnType<typeof getAllWorkspaceCategoriesWithUsage>>;
  subsByParent: Map<string, Awaited<ReturnType<typeof getAllWorkspaceCategoriesWithUsage>>>;
  workspaceId: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {categories.map((c) => (
            <div key={c.id} className="flex flex-col divide-y divide-border">
              <CategoryRow
                workspaceId={workspaceId}
                categoryId={c.id}
                name={c.name}
                icon={c.icon}
                isDefault={c.isDefault}
                isArchived={c.isArchived}
                canManage={true}
                canAddSubcategory={!c.isArchived}
                categoryType={c.type}
              />
              {(subsByParent.get(c.id) ?? []).map((sub) => (
                <div key={sub.id} className="bg-muted/30 pl-6">
                  <CategoryRow
                    workspaceId={workspaceId}
                    categoryId={sub.id}
                    name={sub.name}
                    icon={sub.icon}
                    isDefault={sub.isDefault}
                    isArchived={sub.isArchived}
                    canManage={true}
                  />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
