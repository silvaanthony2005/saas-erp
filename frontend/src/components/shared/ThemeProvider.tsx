"use client"

import * as React from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored ?? getSystemTheme()
    setThemeState(initial)
    document.documentElement.classList.add(initial)
    setMounted(true)
  }, [])

  const setTheme = React.useCallback((newTheme: Theme) => {
    const oldTheme = theme
    document.documentElement.classList.remove(oldTheme)
    document.documentElement.classList.add(newTheme)
    localStorage.setItem("theme", newTheme)
    if (newTheme === "dark") {
      document.documentElement.style.setProperty("--background", "#020617")
      document.documentElement.style.setProperty("--foreground", "#f1f5f9")
      document.documentElement.style.setProperty("--card", "#0f172a")
      document.documentElement.style.setProperty("--card-foreground", "#f1f5f9")
    } else {
      document.documentElement.style.setProperty("--background", "#f8fafc")
      document.documentElement.style.setProperty("--foreground", "#0f172a")
      document.documentElement.style.setProperty("--card", "#ffffff")
      document.documentElement.style.setProperty("--card-foreground", "#0f172a")
    }
    setThemeState(newTheme)
  }, [theme])

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }, [theme, setTheme])

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    toggleTheme
  }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}