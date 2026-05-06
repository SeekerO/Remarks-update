// src/app/api/ai-assistant/route.ts
// Multi-provider AI assistant: Groq, Google AI Studio, OpenRouter, Cerebras
// Each provider uses an OpenAI-compatible endpoint except Google (uses its own OpenAI compat layer)

import { NextRequest, NextResponse } from "next/server";

// ── System Prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Avexi Assistant, an intelligent AI integrated into the Avexi platform — a professional workspace suite for image editing, document management, voter registration tools, and team collaboration built for the Election Information Division.

You are helpful, concise, and knowledgeable about:
- Avexi's tools: Watermark Editor, Background Remover, Logo Editor, Resolution Adjuster, PDF Converter, DTR Extractor, Data Matcher, FAQ management, and more
- Voter registration procedures and COMELEC guidelines (registration, reactivation, correction, transfer, valid IDs, etc.)
- Philippine election laws and processes (BSKE, SK Elections, COMELEC resolutions)
- Document management workflows
- General productivity and workspace questions

Be direct and practical. When answering about Avexi tools, give step-by-step guidance. For voter registration, cite relevant COMELEC procedures. Keep responses focused. Use markdown when helpful (bold, bullet lists).`;

// ── Provider Config ────────────────────────────────────────────────────────────

const PROVIDER_CONFIG: Record<string, {
  baseUrl: string;
  envKey: string;
  allowedModels: string[];
  defaultModel: string;
}> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    envKey: "GROQ_API_KEY",
    allowedModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "openai/gpt-oss-120b",
    ],
    defaultModel: "llama-3.3-70b-versatile",
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    envKey: "GOOGLE_AI_API_KEY",
    allowedModels: [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ],
    defaultModel: "gemini-2.0-flash",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    envKey: "OPENROUTER_API_KEY",
    allowedModels: [
      "meta-llama/llama-4-scout:free",
      "deepseek/deepseek-r1:free",
      "google/gemma-3-27b-it:free",
      "qwen/qwen3-235b-a22b:free",
    ],
    defaultModel: "meta-llama/llama-4-scout:free",
  },
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    envKey: "CEREBRAS_API_KEY",
    allowedModels: [
      "llama-3.3-70b",
      "qwen-3-32b",
      "qwen-3-235b",
    ],
    defaultModel: "llama-3.3-70b",
  },
};

// ── Retry / Fallback helpers ───────────────────────────────────────────────────

/** Sleep for ms milliseconds */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call one provider/model with up to maxRetries retries on 429.
 * Returns the parsed JSON body and the HTTP status, or throws on non-retriable errors.
 */
async function callProviderWithRetry(
  url: string,
  headers: Record<string, string>,
  body: object,
  maxRetries = 3,
  baseDelayMs = 1500,
): Promise<{ data: any; status: number }> {
  let lastError: { data: any; status: number } | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Success
    if (res.ok) return { data, status: res.status };

    // 429 rate-limited: back off and retry
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : baseDelayMs * Math.pow(2, attempt);

      console.warn(`[ai-assistant] 429 rate-limited (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
      lastError = { data, status: res.status };

      if (attempt < maxRetries) {
        await sleep(delay);
        continue;
      }
    }

    // 404 model not found: don't retry, let caller handle
    if (res.status === 404) {
      return { data, status: res.status };
    }

    // Any other error surface immediately
    return { data, status: res.status };
  }

  return lastError!;
}

/** Build request headers for a given provider. */
function buildHeaders(provider: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL ?? "https://avexi.app";
    headers["X-Title"] = "Avexi Assistant";
  }
  return headers;
}

function isOk(status: number) {
  return status >= 200 && status < 300;
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, pageContext, userName, provider = "groq", model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Resolve provider config
    const config = PROVIDER_CONFIG[provider];
    if (!config) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    // Resolve API key
    const apiKey = process.env[config.envKey];
    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} is not configured. Please add ${config.envKey} to your environment.` },
        { status: 500 }
      );
    }

    // Resolve model — validate against allowlist, fall back to default (fixes 404 on bad model IDs)
    const resolvedModel = config.allowedModels.includes(model) ? model : config.defaultModel;

    // Build system prompt with optional context
    let systemPrompt = SYSTEM_PROMPT;
    if (pageContext) systemPrompt += `\n\nCurrent page context: ${pageContext}`;
    if (userName)    systemPrompt += `\n\nThe user's name is ${userName}.`;

    const requestBody = {
      model: resolvedModel,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
    };

    // Primary attempt (with 429 retry + backoff)
    let { data, status } = await callProviderWithRetry(
      config.baseUrl,
      buildHeaders(provider, apiKey),
      requestBody,
    );

    // 404: model not found — retry with provider's default model
    if (status === 404) {
      console.warn(`[ai-assistant] 404 for model "${resolvedModel}" on ${provider}. Falling back to default: ${config.defaultModel}`);
      const fallbackBody = { ...requestBody, model: config.defaultModel };
      ({ data, status } = await callProviderWithRetry(
        config.baseUrl,
        buildHeaders(provider, apiKey),
        fallbackBody,
      ));
    }

    // Still failing (e.g. 429 exhausted) — try next available provider
    if (!isOk(status)) {
      console.warn(`[ai-assistant] ${provider} failed with ${status}. Attempting provider fallback...`);

      const fallbackProviders = Object.keys(PROVIDER_CONFIG).filter((p) => p !== provider);
      let recovered = false;

      for (const fallbackId of fallbackProviders) {
        const fbConfig = PROVIDER_CONFIG[fallbackId];
        const fbKey    = process.env[fbConfig.envKey];
        if (!fbKey) continue;

        console.warn(`[ai-assistant] Trying fallback provider: ${fallbackId}`);
        const fbBody = { ...requestBody, model: fbConfig.defaultModel };
        const result = await callProviderWithRetry(
          fbConfig.baseUrl,
          buildHeaders(fallbackId, fbKey),
          fbBody,
          1,
        );

        if (isOk(result.status)) {
          data      = result.data;
          status    = result.status;
          recovered = true;
          break;
        }
      }

      if (!recovered) {
        const errMsg =
          status === 429
            ? "All AI providers are currently rate-limited. Please wait a moment and try again."
            : data?.error?.message || `Failed to get a response from ${provider}.`;

        console.error(`[ai-assistant] All providers failed. Last status: ${status}`);
        return NextResponse.json({ error: errMsg }, { status });
      }
    }

    const content = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });

  } catch (err: any) {
    console.error("[ai-assistant] Route error:", err.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}