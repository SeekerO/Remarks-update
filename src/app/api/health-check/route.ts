import { NextResponse } from "next/server";

const PING_CONFIGS = [
  {
    id: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    envKey: "GROQ_API_KEY",
    body: {
      model: "llama-3.1-8b-instant",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    },
  },
  {
    id: "google",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    envKey: "GOOGLE_AI_API_KEY",
    body: {
      model: "gemini-2.0-flash",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    },
  },
  {
    id: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    envKey: "OPENROUTER_API_KEY",
    body: {
      model: "meta-llama/llama-4-scout:free",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    },
    extraHeaders: {
      "HTTP-Referer": "https://avexi.app",
      "X-Title": "Avexi Assistant",
    },
  },
  {
    id: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    envKey: "CEREBRAS_API_KEY",
    body: {
      model: "llama-3.3-70b",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    },
  },
];

export async function GET(req: Request) {
  // ── Auth check ──────────────────────────────────────────
  const secret = req.headers.get("x-health-secret");

  if (secret !== process.env.HEALTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    PING_CONFIGS.map(async ({ id, url, envKey, body, extraHeaders }) => {
      const apiKey = process.env[envKey];

      // No API key configured at all
      if (!apiKey) return { id, status: "unconfigured" };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (res.ok || res.status === 429) return { id, status: "online" };
        if (res.status === 401 || res.status === 403)
          return { id, status: "auth_error" };

        // Log unexpected status for debugging
        console.warn(`[health-check] ${id} returned ${res.status}`);
        return { id, status: "error" };
      } catch (err: any) {
        console.warn(`[health-check] ${id} threw:`, err.message);
        return { id, status: "offline" };
      }
    }),
  );

  const payload = Object.fromEntries(
    results.map(({ id, status }) => [id, status]),
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
    },
  });
}
