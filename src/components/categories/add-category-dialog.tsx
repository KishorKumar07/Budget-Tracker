"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateCategoryForm } from "./create-category-form";

export function AddCategoryDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Category
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm
            workspaceId={workspaceId}
            defaultType="EXPENSE"
            allowTypeChoice
            onCreated={() => {
              toast.success("Category created.");
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
