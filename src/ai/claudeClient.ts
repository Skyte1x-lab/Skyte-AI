import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, Language } from '../types';
import { buildSystemPrompt } from './systemPrompt';
import { executeTool, toolDefinitions } from './tools';

const HISTORY_LIMIT = 20;
const MAX_TOOL_ROUNDS = 5;

export class ClaudeAuthError extends Error {}
export class ClaudeRateLimitError extends Error {}

export async function askClaude(
  apiKey: string,
  model: string,
  language: Language,
  history: ChatMessage[],
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const messages: Anthropic.MessageParam[] = history
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    let rounds = 0;
    while (true) {
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: buildSystemPrompt(language),
        messages,
        tools: toolDefinitions,
      });

      if (response.stop_reason !== 'tool_use' || rounds >= MAX_TOOL_ROUNDS) {
        return response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim();
      }

      rounds += 1;
      messages.push({ role: 'assistant', content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: executeTool(b.name, b.input),
        }));
      messages.push({ role: 'user', content: results });
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ClaudeAuthError(err.message);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ClaudeRateLimitError(err.message);
    }
    throw err;
  }
}
