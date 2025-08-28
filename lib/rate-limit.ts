import type { NextRequest } from "next/server"

type StoreEntry = {
  count: number
  reset: number // epoch ms when window resets
}

type CheckOptions = {
  windowMs: number
  limit: number
  identifier: string // e.g., "content" or "generate"
}

type CheckResult = {
  allowed: boolean
  limit: number
  remaining: number
  reset: number // epoch seconds for header friendliness
}

// Simple in-memory store, shared across hot reloads in dev via globalThis
declare global {
  var __rateLimitStore__: Map<string, StoreEntry> | undefined
}

const store: Map<string, StoreEntry> = globalThis.__rateLimitStore__ ?? new Map<string, StoreEntry>()
globalThis.__rateLimitStore__ = store

export function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "127.0.0.1"
  const xri = req.headers.get("x-real-ip")
  if (xri) return xri
  // NextRequest.ip is available on some platforms; fall back if present
  type NextRequestWithIP = NextRequest & { ip?: string }
  const maybeIp = (req as NextRequestWithIP).ip
  if (maybeIp) return maybeIp
  return "127.0.0.1"
}

export function checkRateLimit(req: NextRequest, opts: CheckOptions): CheckResult {
  const now = Date.now()
  const ip = getClientIP(req)
  const key = `${opts.identifier}:${ip}`
  const existing = store.get(key)

  if (!existing || now >= existing.reset) {
    const reset = now + opts.windowMs
    store.set(key, { count: 1, reset })
    return {
      allowed: true,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - 1),
      reset: Math.ceil(reset / 1000),
    }
  }

  existing.count += 1
  const allowed = existing.count <= opts.limit
  const remaining = Math.max(0, opts.limit - existing.count)
  return {
    allowed,
    limit: opts.limit,
    remaining,
    reset: Math.ceil(existing.reset / 1000),
  }
}

export function rateLimitHeaders(info: CheckResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(info.limit),
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": String(info.reset),
  }
  const nowSec = Math.ceil(Date.now() / 1000)
  const retryAfter = Math.max(0, info.reset - nowSec)
  if (info.remaining === 0 || !info.allowed) {
    headers["Retry-After"] = String(retryAfter)
  }
  return headers
}
