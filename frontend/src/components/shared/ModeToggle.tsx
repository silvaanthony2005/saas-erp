"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/shared/ThemeProvider"
import { cn } from "@/lib/utils"

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 rounded-full transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "bg-slate-100 dark:bg-slate-800",
        "hover:bg-slate-200 dark:hover:bg-slate-700",
        "text-slate-600 dark:text-slate-300"
      )}
      aria-label="Cambiar tema"
    >
      <Sun className="absolute inset-0 m-auto h-5 w-5 transition-opacity duration-300" style={{ opacity: theme === "light" ? 1 : 0 }} />
      <Moon className="absolute inset-0 m-auto h-5 w-5 transition-opacity duration-300" style={{ opacity: theme === "dark" ? 1 : 0 }} />
    </button>
  )
}