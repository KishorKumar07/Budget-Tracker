export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: ProviderToolCall[] }
  | { role: "tool"; toolCallId: string; toolName: string; content: string };

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
};

export type ProviderToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /**
   * Opaque, provider-specific data that must be echoed back verbatim when
   * this call is replayed into a later turn's history (e.g. Gemini's
   * `thoughtSignature` on "thinking" models — required on any function-call
   * part sent back to the API, or Gemini rejects the request). Providers
   * that don't need this leave it undefined; only the provider that set it
   * ever reads it back.
   */
  providerMetadata?: unknown;
};

export type ChatTurnResult = {
  content: string | null;
  toolCalls: ProviderToolCall[];
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    public provider: "gemini" | "grok",
    public cause?: unknown
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export interface AiProvider {
  readonly name: "gemini" | "grok";
  sendChatTurn(messages: ChatMessage[], tools: ToolDefinition[], apiKey: string): Promise<ChatTurnResult>;
}
