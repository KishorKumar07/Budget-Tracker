"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { saveApiKeyAction, deleteApiKeyAction, testApiKeyAction, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/layout/submit-button";

type KeyStatus = {
  provider: "GEMINI" | "GROK";
  label: string | null;
  lastUsedAt: Date | null;
  lastValidatedAt: Date | null;
  lastValidationError: string | null;
} | null;

const initialState: ActionState = {};

export function AiKeysForm({
  geminiStatus,
  grokStatus,
}: {
  geminiStatus: KeyStatus;
  grokStatus: KeyStatus;
}) {
  return (
    <div className="flex flex-col gap-8">
      <ProviderKeyRow
        key={geminiStatus ? "gemini-saved" : "gemini-empty"}
        provider="GEMINI"
        title="Gemini"
        description="Google's Gemini API has a free tier — get a key at aistudio.google.com."
        status={geminiStatus}
      />
      <div className="h-px bg-border" />
      <ProviderKeyRow
        key={grokStatus ? "grok-saved" : "grok-empty"}
        provider="GROK"
        title="Grok"
        description="Used only as a fallback if Gemini is unavailable. xAI's API is paid — no free tier today."
        status={grokStatus}
      />
    </div>
  );
}

function ProviderKeyRow({
  provider,
  title,
  description,
  status,
}: {
  provider: "GEMINI" | "GROK";
  title: string;
  description: string;
  status: KeyStatus;
}) {
  const [saveState, saveAction] = useActionState(saveApiKeyAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteApiKeyAction, initialState);
  const [testState, testAction] = useActionState(testApiKeyAction, initialState);
  const [editing, setEditing] = useState(!status);

  const lastHandledSave = useRef(initialState);
  const lastHandledDelete = useRef(initialState);
  const lastHandledTest = useRef(initialState);

  useEffect(() => {
    if (saveState !== lastHandledSave.current) {
      if (saveState.success) {
        toast.success(`${title} key saved.`);
      } else if (saveState.error) {
        toast.error(saveState.error);
      }
    }
    lastHandledSave.current = saveState;
  }, [saveState, title]);

  useEffect(() => {
    if (deleteState !== lastHandledDelete.current && deleteState.success) {
      toast.success(`${title} key removed.`);
    }
    lastHandledDelete.current = deleteState;
  }, [deleteState, title]);

  useEffect(() => {
    if (testState !== lastHandledTest.current) {
      if (testState.success) toast.success(`${title} key is working.`);
      else if (testState.error) toast.error(testState.error);
    }
    lastHandledTest.current = testState;
  }, [testState, title]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {status && !editing ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            {status.lastValidationError ? (
              <>
                <X className="size-4 text-destructive" />
                <span className="text-destructive">{status.lastValidationError}</span>
              </>
            ) : (
              <>
                <Check className="size-4 text-success" />
                <span className="text-foreground">Key saved{status.label ? ` (${status.label})` : ""}</span>
              </>
            )}
          </div>
          {status.lastValidatedAt && (
            <p className="text-xs text-muted-foreground">
              Last validated {format(new Date(status.lastValidatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
          {status.lastUsedAt && (
            <p className="text-xs text-muted-foreground">
              Last used {format(new Date(status.lastUsedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}

          <div className="mt-1 flex gap-2">
            <form action={testAction}>
              <input type="hidden" name="provider" value={provider} suppressHydrationWarning />
              <TestButton />
            </form>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              Replace
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="provider" value={provider} suppressHydrationWarning />
              <DeleteButton />
            </form>
          </div>
        </div>
      ) : (
        <form action={saveAction} className="flex flex-col gap-2">
          <input type="hidden" name="provider" value={provider} suppressHydrationWarning />
          <Label htmlFor={`${provider}-key`}>API key</Label>
          <Input id={`${provider}-key`} name="apiKey" type="password" placeholder="Paste your key" required autoComplete="off" />
          <Label htmlFor={`${provider}-label`}>Label (optional)</Label>
          <Input id={`${provider}-label`} name="label" placeholder="e.g. personal key" maxLength={60} />
          <div className="mt-1 flex gap-2">
            <SubmitButton className="w-fit">Save</SubmitButton>
            {status && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function TestButton() {
  return (
    <SubmitButton className="w-fit" variant="outline" size="sm">
      Test
    </SubmitButton>
  );
}

function DeleteButton() {
  return (
    <SubmitButton className="w-fit" variant="ghost" size="sm">
      Delete
    </SubmitButton>
  );
}
