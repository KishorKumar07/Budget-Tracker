"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Trash2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateCategoryForm } from "./create-category-form";
import {
  renameCategoryAction,
  archiveCategoryAction,
  unarchiveCategoryAction,
  type RenameCategoryState,
} from "@/lib/categories/actions";

const initialState: RenameCategoryState = {};

export function CategoryRow({
  workspaceId,
  categoryId,
  name,
  icon,
  isDefault,
  isArchived,
  canManage,
  canAddSubcategory = false,
  categoryType,
}: {
  workspaceId: string;
  categoryId: string;
  name: string;
  icon: string;
  isDefault: boolean;
  isArchived: boolean;
  canManage: boolean;
  canAddSubcategory?: boolean;
  categoryType?: "EXPENSE" | "INCOME" | "SAVINGS";
}) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(renameCategoryAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state !== lastHandledState.current && state.success) {
      setEditing(false);
    }
    lastHandledState.current = state;
  }, [state]);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-base">{icon}</span>

      {editing ? (
        <form action={formAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <Input key={name} name="name" defaultValue={name} maxLength={40} required className="h-7 flex-1" autoFocus />
          <Button type="submit" size="icon-xs" variant="ghost" aria-label="Save">
            <Check className="size-3.5" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" aria-label="Cancel" onClick={() => setEditing(false)}>
            <X className="size-3.5" />
          </Button>
        </form>
      ) : (
        <>
          <span className={`flex-1 text-sm ${isArchived ? "text-muted-foreground" : "text-foreground"}`}>
            {name}
            {isArchived && <span className="ml-2 text-xs text-muted-foreground">(archived)</span>}
          </span>

          {canManage && !isDefault && (
            <div className="flex shrink-0 items-center gap-1">
              {!isArchived && (
                <Button size="icon-xs" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {isArchived ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Restore"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await unarchiveCategoryAction(workspaceId, categoryId);
                      toast.success("Category restored.");
                    })
                  }
                >
                  <ArchiveRestore className="size-3.5" />
                </Button>
              ) : (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Archive"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await archiveCategoryAction(workspaceId, categoryId);
                      toast.success("Category archived.");
                    })
                  }
                >
                  <Archive className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Delete"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}

          {canAddSubcategory && categoryType && (
            <Button size="icon-xs" variant="ghost" aria-label="Add subcategory" onClick={() => setAddSubOpen(true)}>
              <Plus className="size-3.5" />
            </Button>
          )}

          {isDefault && (
            <span className="shrink-0 text-xs text-muted-foreground">Default</span>
          )}
        </>
      )}

      <DeleteCategoryDialog
        workspaceId={workspaceId}
        categoryId={categoryId}
        categoryName={name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {canAddSubcategory && categoryType && (
        <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Subcategory</DialogTitle>
            </DialogHeader>
            <CreateCategoryForm
              workspaceId={workspaceId}
              defaultType={categoryType}
              parentId={categoryId}
              parentName={name}
              onCreated={() => {
                toast.success("Subcategory created.");
                setAddSubOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
