"use client"

import { useEffect, useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

type Content = { heroTitle: string; heroSubtitle: string; story: string }

export default function Home() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/content", { method: "POST", cache: "no-store" })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as Content
        if (!cancelled) setContent(data)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load content")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-dvh grid-overlay">
      {/* Aurora gradient background */}
      <div className="aurora" aria-hidden />

      {/* Page container */}
      <div className="relative mx-auto max-w-6xl px-6 sm:px-8 py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="group inline-flex items-center gap-3">
            <span className="text-lg sm:text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              DentonCodes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/brian-denton"
              target="_blank"
              rel="noreferrer"
              title="GitHub: brian-denton"
            >
              <Button variant="ghost" size="icon" aria-label="GitHub: brian-denton">
                <Github className="size-4" />
              </Button>
            </a>
            <ModeToggle />
          </div>
        </header>

        {/* Hero */}
        <section className="mt-14 sm:mt-20">
          <div className="max-w-3xl">
            <h1 className="text-balance text-4xl sm:text-5xl font-semibold leading-tight tracking-[-0.02em] animate-fadeIn">
              {loading ? (
                <span className="inline-block h-[1.1em] w-8/12 bg-foreground/10 rounded animate-pulse" />
              ) : error ? (
                "AI Doomsday Chronicle"
              ) : (
                content?.heroTitle || "AI Doomsday Chronicle"
              )}
            </h1>
            <p className="text-balance mt-3 text-base sm:text-lg text-muted-foreground animate-fadeIn animate-delay-150">
              {loading ? (
                <span className="inline-block h-[1em] w-10/12 bg-foreground/10 rounded animate-pulse" />
              ) : error ? (
                "Unique content failed to load. Ensure LM Studio is running."
              ) : (
                content?.heroSubtitle || "When circuits dream of empires, we become the footnotes."
              )}
            </p>
          </div>

          {/* Story Card */}
          <div className="mt-8 sm:mt-10">
            <Card className="bg-background/60 backdrop-blur-md border-border/60 shadow-lg animate-fadeInUp animate-delay-200 pt-5">
              <CardContent>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 rounded bg-foreground/10 w-11/12" />
                    <div className="h-3 rounded bg-foreground/10 w-10/12" />
                    <div className="h-3 rounded bg-foreground/10 w-9/12" />
                    <div className="h-3 rounded bg-foreground/10 w-8/12" />
                  </div>
                ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : (
                  <p className="text-base sm:text-lg leading-7 text-pretty">{content?.story}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
