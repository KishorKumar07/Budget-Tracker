"use client";

import { useId, useMemo, useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateCategoryForm } from "./create-category-form";
import { cn } from "@/lib/utils";

export type SelectableCategory = {
  id: string;
  name: string;
  icon: string;
  group: string;
  subcategories?: SelectableCategory[];
};

export function CategorySelector({
  id,
  workspaceId,
  type,
  categories,
  frequentlyUsed,
  value,
  onChange,
}: {
  id?: string;
  workspaceId: string;
  type: "EXPENSE" | "INCOME" | "SAVINGS";
  categories: SelectableCategory[];
  frequentlyUsed: SelectableCategory[];
  value: SelectableCategory | null;
  onChange: (category: SelectableCategory) => void;
}) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  // When a category with subcategories is picked, we show a second step
  // to choose a subcategory (or the parent itself) before closing.
  const [subcategoryParent, setSubcategoryParent] = useState<SelectableCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, SelectableCategory[]>();
    for (const category of filtered) {
      const list = map.get(category.group) ?? [];
      list.push(category);
      map.set(category.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const showFrequent = !search.trim() && frequentlyUsed.length > 0;

  const handleSelect = (category: SelectableCategory) => {
    if (category.subcategories && category.subcategories.length > 0) {
      setSubcategoryParent(category);
      return;
    }
    onChange(category);
    setOpen(false);
  };

  return (
    <>
      <button
        id={triggerId}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
      >
        {value ? (
          <>
            <span className="text-base">{value.icon}</span>
            <span className="text-foreground">{value.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select category</span>
        )}
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setSubcategoryParent(null);
          setOpen(next);
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-md">
          {subcategoryParent ? (
            <>
              <DialogHeader className="border-b border-border p-4">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Back"
                    onClick={() => setSubcategoryParent(null)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <DialogTitle>
                    {subcategoryParent.icon} {subcategoryParent.name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange(subcategoryParent);
                    setOpen(false);
                    setSubcategoryParent(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-accent",
                    value?.id === subcategoryParent.id && "bg-accent"
                  )}
                >
                  <span className="text-base">{subcategoryParent.icon}</span>
                  Just {subcategoryParent.name}
                </button>

                <p className="px-2.5 pt-3 pb-1.5 text-xs font-medium text-muted-foreground">
                  Subcategories
                </p>
                {subcategoryParent.subcategories?.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onChange(sub);
                      setOpen(false);
                      setSubcategoryParent(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                      value?.id === sub.id && "bg-accent"
                    )}
                  >
                    <span className="text-base">{sub.icon}</span>
                    <span className="text-foreground">{sub.name}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="size-4" />
                  Create subcategory
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="border-b border-border p-4">
                <DialogTitle>Select Category</DialogTitle>
                <div className="relative mt-2">
                  <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-2">
                {showFrequent && (
                  <CategoryGroup
                    title="Frequently Used"
                    items={frequentlyUsed}
                    onSelect={handleSelect}
                    selectedId={value?.id}
                  />
                )}

                {grouped.map(([group, items]) => (
                  <CategoryGroup
                    key={group}
                    title={group}
                    items={items}
                    onSelect={handleSelect}
                    selectedId={value?.id}
                  />
                ))}

                {filtered.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No categories match &quot;{search}&quot;.
                  </p>
                )}
              </div>

              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="size-4" />
                  Create new category
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{subcategoryParent ? "Create Subcategory" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm
            workspaceId={workspaceId}
            defaultType={type}
            parentId={subcategoryParent?.id}
            parentName={subcategoryParent?.name}
            onCreated={(category) => {
              onChange({ id: category.id, name: category.name, icon: category.icon, group: "Custom" });
              setCreateOpen(false);
              setOpen(false);
              setSubcategoryParent(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryGroup({
  title,
  items,
  onSelect,
  selectedId,
}: {
  title: string;
  items: SelectableCategory[];
  onSelect: (category: SelectableCategory) => void;
  selectedId?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-1 gap-0.5">
        {items.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
              selectedId === category.id && "bg-accent"
            )}
          >
            <span className="text-base">{category.icon}</span>
            <span className="flex-1 text-foreground">{category.name}</span>
            {category.subcategories && category.subcategories.length > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
