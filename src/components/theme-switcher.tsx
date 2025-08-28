"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const htmlHasDark = document.documentElement.classList.contains('dark')
    return htmlHasDark ? 'dark' : 'light'
  })
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Sync with persisted preference or system on mount
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = savedTheme === 'light' || savedTheme === 'dark'
      ? (savedTheme as 'light' | 'dark')
      : (systemPrefersDark ? 'dark' : 'light')
    setTheme(initial)
    applyTheme(initial)

    // Respond to storage changes (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue)
        applyTheme(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const html = document.documentElement
    const isDark = newTheme === 'dark'
    html.classList.toggle('dark', isDark)
    html.style.colorScheme = isDark ? 'dark' : 'light'
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-none justify-start w-full h-auto"
    >
      {theme === 'light' ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">
        {theme === 'light' ? 'Dark' : 'Light'} mode
      </span>
    </Button>
  )
}
