import "server-only";
import { GoogleGenAI, FunctionCallingConfigMode, type Content, type Part } from "@google/genai";
import { AiProviderError, type AiProvider, type ChatMessage, type ChatTurnResult, type ToolDefinition, type ProviderToolCall } from "../provider-types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

function toGeminiContents(messages: ChatMessage[]): { system: string | undefined; contents: Content[] } {
  let system: string | undefined;
  const contents: Content[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      system = system ? `${system}\n\n${message.content}` : message.content;
      continue;
    }

    if (message.role === "user") {
      contents.push({ role: "user", parts: [{ text: message.content }] });
      continue;
    }

    if (message.role === "assistant") {
      const parts: Part[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const call of message.toolCalls ?? []) {
        const thoughtSignature =
          typeof call.providerMetadata === "string" ? call.providerMetadata : undefined;
        parts.push({
          functionCall: { name: call.name, args: call.arguments },
          ...(thoughtSignature ? { thoughtSignature } : {}),
        });
      }
      contents.push({ role: "model", parts });
      continue;
    }

    // role === "tool"
    contents.push({
      role: "user",
      parts: [{ functionResponse: { name: message.toolName, response: { result: message.content } } }],
    });
  }

  return { system, contents };
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;

  async sendChatTurn(messages: ChatMessage[], tools: ToolDefinition[], apiKey: string): Promise<ChatTurnResult> {
    try {
      const client = new GoogleGenAI({ apiKey });
      const { system, contents } = toGeminiContents(messages);

      const response = await client.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: system,
          tools: tools.length > 0 ? [{ functionDeclarations: tools.map(toFunctionDeclaration) }] : undefined,
          toolConfig: tools.length > 0 ? { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } } : undefined,
        },
      });

      // Read raw parts (not the .functionCalls convenience getter) so each
      // call can be paired with its own thoughtSignature — "thinking"
      // models like gemini-3.1-flash-lite require that signature echoed
      // back on any function-call part sent in a later turn's history, or
      // the API rejects the request.
      const responseParts = response.candidates?.[0]?.content?.parts ?? [];
      const toolCalls: ProviderToolCall[] = [];
      let index = 0;
      for (const part of responseParts) {
        if (!part.functionCall) continue;
        toolCalls.push({
          id: part.functionCall.id ?? `gemini-call-${index}`,
          name: part.functionCall.name ?? "",
          arguments: part.functionCall.args ?? {},
          providerMetadata: part.thoughtSignature,
        });
        index++;
      }

      return {
        content: response.text ?? null,
        toolCalls,
      };
    } catch (error) {
      throw new AiProviderError(extractErrorMessage(error), "gemini", error);
    }
  }
}

/**
 * The Gemini SDK throws with `.message` set to the raw JSON error body
 * (e.g. `{"error":{"code":400,"message":"API key not valid...","status":
 * "INVALID_ARGUMENT"}}`) rather than a plain string — extract just the
 * human-readable message so it's safe to show a user, not a JSON dump.
 */
function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Gemini request failed.";

  try {
    const parsed = JSON.parse(error.message);
    const message = parsed?.error?.message;
    if (typeof message === "string") return message;
  } catch {
    // not JSON — fall through to the raw message
  }

  return error.message;
}

function toFunctionDeclaration(tool: ToolDefinition) {
  return {
    name: tool.name,
    description: tool.description,
    // parametersJsonSchema accepts plain JSON Schema (from z.toJSONSchema());
    // Gemini's own `parameters` field wants its custom Schema/Type-enum shape,
    // which we deliberately avoid mapping into to keep one JSON Schema source
    // of truth shared with the Grok provider.
    parametersJsonSchema: tool.parameters,
  };
}
