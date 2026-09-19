"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export type ProposedAction = {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  summary: string;
};

export type ChatMessageItem = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  proposedAction: ProposedAction | null;
  confirmed: boolean;
  createdAt: string;
  pending?: boolean;
  dismissed?: boolean;
};

const TARGET_PATH: Record<string, string> = {
  transactions: "/transactions",
  categories: "/settings/categories",
  budgets: "/budgets",
};

export function useChat(workspaceId: string) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/ai/chat?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();
      if (res.ok) {
        setConversationId(data.conversationId);
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [workspaceId]);

  const sendMessage = useCallback(
    async (message: string) => {
      setError(null);
      const userMessage: ChatMessageItem = {
        id: `local-${Date.now()}`,
        role: "USER",
        content: message,
        proposedAction: null,
        confirmed: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, message }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }

        setConversationId(data.conversationId);

        const assistantMessage: ChatMessageItem = {
          id: `local-assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: data.kind === "answer" ? data.content : data.proposal.summary,
          proposedAction: data.kind === "proposal" ? data.proposal : null,
          confirmed: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setError("Couldn't reach the assistant. Check your connection and try again.");
      } finally {
        setSending(false);
      }
    },
    [workspaceId]
  );

  const confirmProposal = useCallback(
    async (proposal: ProposedAction) => {
      if (!conversationId) return;
      setError(null);

      try {
        const res = await fetch("/api/ai/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, conversationId, proposalId: proposal.id }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Couldn't confirm that action.");
          return;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.proposedAction?.id === proposal.id ? { ...m, confirmed: true } : m
          )
        );

        const path = TARGET_PATH[data.target as string];
        if (path) router.push(path);
      } catch {
        setError("Couldn't reach the server to confirm that action.");
      }
    },
    [workspaceId, conversationId, router]
  );

  const dismissProposal = useCallback((proposalId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.proposedAction?.id === proposalId ? { ...m, dismissed: true } : m))
    );
  }, []);

  return {
    conversationId,
    messages,
    loadingHistory,
    sending,
    error,
    loadHistory,
    sendMessage,
    confirmProposal,
    dismissProposal,
  };
}
