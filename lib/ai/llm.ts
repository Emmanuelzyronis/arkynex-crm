import "server-only";

/**
 * Minimal, dependency-free LLM client.
 *
 * Talks to any OpenAI-compatible chat-completions endpoint — by default the
 * Vercel AI Gateway (https://vercel.com/docs/ai-gateway) so the model calls are
 * billed/observed through Vercel alongside the deployment. Falls back to the
 * public OpenAI API when `OPENAI_API_KEY` is set instead.
 *
 * Everything degrades gracefully: when no key is configured `chatJSON` returns
 * `null` and the deterministic heuristics in `score-lead.ts` / `generate-actions.ts`
 * keep working unchanged.
 */

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

export type ChatOptions = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Ask the model to reply with a single JSON object and parse it. */
  json?: boolean;
  model?: string;
  timeoutMs?: number;
};

type ResolvedConfig = { url: string; key: string; model: string };

export function llmProvider(): "vercel-ai-gateway" | "openai" | null {
  if (process.env.AI_GATEWAY_API_KEY) return "vercel-ai-gateway";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function isLlmConfigured(): boolean {
  return llmProvider() !== null;
}

function resolveConfig(modelOverride?: string): ResolvedConfig | null {
  const provider = llmProvider();
  if (!provider) return null;

  if (provider === "vercel-ai-gateway") {
    const base =
      process.env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, "") ??
      "https://ai-gateway.vercel.sh/v1";
    return {
      url: `${base}/chat/completions`,
      key: process.env.AI_GATEWAY_API_KEY as string,
      model: modelOverride ?? process.env.AI_MODEL ?? "openai/gpt-4o-mini",
    };
  }

  const base =
    process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") ?? "https://api.openai.com/v1";
  return {
    url: `${base}/chat/completions`,
    key: process.env.OPENAI_API_KEY as string,
    model: modelOverride ?? process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

/** Low-level chat call. Returns the assistant text, or null on any failure. */
export async function chat(options: ChatOptions): Promise<string | null> {
  const config = resolveConfig(options.model);
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 800,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[llm] ${config.model} responded ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("[llm] request failed:", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Chat call that parses a JSON object response. Returns `null` when the model
 * is unconfigured, errors, or returns non-JSON — callers should treat that as
 * "fall back to heuristics".
 */
export async function chatJSON<T>(options: ChatOptions): Promise<T | null> {
  const text = await chat({ ...options, json: true });
  if (!text) return null;

  try {
    // Tolerate markdown fences some models add even in JSON mode.
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("[llm] could not parse JSON response");
    return null;
  }
}
