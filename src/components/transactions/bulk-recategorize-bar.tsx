"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { bulkRecategorizeAction } from "@/app/(dashboard)/transactions/actions";
import type { SelectableCategory } from "@/components/categories/category-selector";

export function BulkRecategorizeBar({
  workspaceId,
  selectedIds,
  categories,
  onDone,
}: {
  workspaceId: string;
  selectedIds: string[];
  categories: SelectableCategory[];
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  const handleMove = () => {
    if (!categoryId) return;
    startTransition(async () => {
      const result = await bulkRecategorizeAction(workspaceId, selectedIds, categoryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Moved ${result.movedCount} transaction${result.movedCount === 1 ? "" : "s"}.`
        );
        setCategoryId("");
        onDone();
      }
    });
  };

  return (
    <div className="sticky top-0 z-10 mb-3 flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center">
      <p className="text-sm font-medium text-foreground">
        {selectedIds.length} selected
      </p>

      {categories.length === 0 ? (
        <p className="flex-1 text-sm text-muted-foreground">
          Select transactions of only one type (expense, income, or savings) to move them together.
        </p>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <NativeSelect
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 sm:max-w-64"
          >
            <option value="">Move to category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </NativeSelect>

          <Button size="sm" disabled={!categoryId || isPending} onClick={handleMove}>
            Move
          </Button>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onDone} disabled={isPending}>
        <X className="size-3.5" />
        Cancel
      </Button>
    </div>
  );
}
