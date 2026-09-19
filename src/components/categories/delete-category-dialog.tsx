"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction, archiveCategoryAction } from "@/lib/categories/actions";

export function DeleteCategoryDialog({
  workspaceId,
  categoryId,
  categoryName,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  categoryId: string;
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [inUseCount, setInUseCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(workspaceId, categoryId);
      if (result.error) {
        if (result.inUseCount !== undefined) {
          setInUseCount(result.inUseCount);
        } else {
          toast.error(result.error);
          onOpenChange(false);
        }
      } else {
        toast.success("Category deleted.");
        onOpenChange(false);
      }
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveCategoryAction(workspaceId, categoryId);
      toast.success("Category archived.");
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setInUseCount(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {inUseCount !== null ? "Category in use" : `Delete "${categoryName}"?`}
          </DialogTitle>
          <DialogDescription>
            {inUseCount !== null
              ? `This category contains ${inUseCount} transaction${inUseCount === 1 ? "" : "s"}. You can archive it instead of deleting it.`
              : "This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          {inUseCount !== null ? (
            <Button onClick={handleArchive} disabled={isPending}>
              Archive Category
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
