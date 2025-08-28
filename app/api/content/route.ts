import { NextRequest } from "next/server"
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit"

type Provider = "lmstudio" | "ollama" | "auto"

const PROVIDER: Provider = (process.env.AI_PROVIDER?.toLowerCase() as Provider) || "lmstudio"
const BASE_URL =
  PROVIDER === "ollama"
    ? process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    : process.env.LMSTUDIO_BASE_URL || "http://localhost:1234"
const MODEL =
  process.env.AI_MODEL ||
  (PROVIDER === "ollama" ? process.env.OLLAMA_MODEL : process.env.LMSTUDIO_MODEL) ||
  "qwen2.5:3b-instruct"

export const runtime = "nodejs"

type Content = {
  heroTitle: string
  heroSubtitle: string
  story: string
}

function tryExtractJson(text: string): Content | null {
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === "object" && "heroTitle" in obj && "story" in obj) return obj as Content
  } catch {}
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1)
    try {
      const obj = JSON.parse(candidate)
      if (obj && typeof obj === "object" && "heroTitle" in obj && "story" in obj) return obj as Content
    } catch {}
  }
  return null
}

export async function POST(_req: NextRequest) {
  try {
    const rl = checkRateLimit(_req, { identifier: "content", limit: 10, windowMs: 60_000 })
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: rateLimitHeaders(rl),
      })
    }

    const system = [
      "You write vivid, cinematic micro-stories about AI doomsday scenarios.",
      "Content should be dark and scary but not explicit.",
      "Return STRICT JSON only with keys: heroTitle, heroSubtitle, story.",
      "heroTitle: 4–7 words, IMPORTANT-Title Case without underscores, no punctuation at end.",
      "heroSubtitle: one sentence, 14–22 words, evocative but concise.",
      "story: 120–180 words, first or close-third person, hopeful undertone, not nihilistic.",
    ].join(" ")

    const user = [
      "Create original content about AI taking over the world in a doomsday scenario.",
      "Follow the requested structure and lengths exactly.",
      "Respond with JSON only — no code fences, no commentary.",
    ].join(" ")

    const MAX_INVALID_JSON_RETRIES = 2
    for (let attempt = 0; attempt <= MAX_INVALID_JSON_RETRIES; attempt++) {
      let text: string
      try {
        text = await callChat({ provider: PROVIDER, baseUrl: BASE_URL, model: MODEL, temperature: 0.9, system, user })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return new Response(JSON.stringify({ error: msg }), { status: 500 })
      }

      const parsed = tryExtractJson(text)
      if (parsed) return Response.json(parsed, { headers: rateLimitHeaders(rl) })

      if (attempt < MAX_INVALID_JSON_RETRIES) {
        await new Promise((r) => setTimeout(r, 150 + Math.random() * 150))
      }
    }

    return new Response(JSON.stringify({ error: "Model did not return valid JSON after 3 attempts." }), {
      status: 500,
      headers: rateLimitHeaders(rl),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}

type ChatArgs = {
  provider: Provider
  baseUrl: string
  model: string
  temperature: number
  system: string
  user: string
}

async function callChat({ provider, baseUrl, model, temperature, system, user }: ChatArgs): Promise<string> {
  if (provider === "lmstudio") {
    const url = `${baseUrl}/v1/chat/completions`
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature,
          stream: false,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`LM Studio error (${url}): ${res.status} ${text}`)
      }
      const data = await res.json()
      return (data?.choices?.[0]?.message?.content as string) ?? ""
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`LM Studio fetch failed (${url}): ${msg}`)
    }
  }

  if (provider === "ollama") {
    const url = `${baseUrl}/api/chat`
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          think: false,
          keepalive: '-1m',
          options: { temperature },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Ollama error (${url}): ${res.status} ${text}`)
      }
      const data = await res.json()
      return (data?.message?.content as string) ?? ""
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Ollama fetch failed (${url}): ${msg}`)
    }
  }

  try {
    const lmBase = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234"
    return await callChat({ provider: "lmstudio", baseUrl: lmBase, model, temperature, system, user })
  } catch {
    const ollBase = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    return await callChat({ provider: "ollama", baseUrl: ollBase, model, temperature, system, user })
  }
}
