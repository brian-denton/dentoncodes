"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark" | "system"

function getSystemPref(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ModeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("theme") as Theme) || "system"
      setTheme(saved)
    } catch {}
  }, [])

  useEffect(() => {
    const value = theme === "system" ? getSystemPref() : theme
    const root = document.documentElement
    if (value === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    try { localStorage.setItem("theme", theme) } catch {}
  }, [theme])

  const cycle = () => setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"))

  const icon = theme === "light" ? <Sun className="size-4" /> : theme === "dark" ? <Moon className="size-4" /> : (
    <div className="relative size-4">
      <Sun className="absolute inset-0 size-4 opacity-70" />
      <Moon className="absolute inset-0 size-4 opacity-70" />
    </div>
  )

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={cycle} title={`Theme: ${theme}`}>
      {icon}
    </Button>
  )
}

