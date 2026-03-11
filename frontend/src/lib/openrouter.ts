/**
 * Open Router API client for chat completions.
 * See https://openrouter.ai/docs/api-reference/chat-completion
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type OpenRouterMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface OpenRouterOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

function getConfig() {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const model = (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
  return { apiKey, model };
}

export async function openRouterChat(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const { apiKey, model: defaultModel } = getConfig();
  if (!apiKey || apiKey === '' || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to your environment variables.');
  }

  const model = options.model ?? defaultModel;
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.max_tokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Open Router API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';
  return content.trim();
}
