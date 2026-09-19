import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { AiProviderError, type AiProvider, type ChatMessage, type ChatTurnResult, type ToolDefinition } from "../provider-types";

const MODEL = process.env.GROK_MODEL ?? "grok-4-fast";
const BASE_URL = "https://api.x.ai/v1";

function toOpenAiMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message): ChatCompletionMessageParam => {
    if (message.role === "system") return { role: "system", content: message.content };
    if (message.role === "user") return { role: "user", content: message.content };
    if (message.role === "assistant") {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.toolCalls?.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })),
      };
    }
    return { role: "tool", tool_call_id: message.toolCallId, content: message.content };
  });
}

function toOpenAiTools(tools: ToolDefinition[]): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export class GrokProvider implements AiProvider {
  readonly name = "grok" as const;

  async sendChatTurn(messages: ChatMessage[], tools: ToolDefinition[], apiKey: string): Promise<ChatTurnResult> {
    try {
      const client = new OpenAI({ apiKey, baseURL: BASE_URL });

      const response = await client.chat.completions.create({
        model: MODEL,
        messages: toOpenAiMessages(messages),
        tools: tools.length > 0 ? toOpenAiTools(tools) : undefined,
      });

      const message = response.choices[0]?.message;
      const toolCalls = (message?.tool_calls ?? []).filter((call) => call.type === "function");

      return {
        content: message?.content ?? null,
        toolCalls: toolCalls.map((call) => ({
          id: call.id,
          name: call.function.name,
          arguments: safeJsonParse(call.function.arguments),
        })),
      };
    } catch (error) {
      throw new AiProviderError(
        error instanceof Error ? error.message : "Grok request failed.",
        "grok",
        error
      );
    }
  }
}

function safeJsonParse(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
