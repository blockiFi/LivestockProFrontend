import { createContext, useContext, useEffect, useMemo, useState } from "react"

type ThemePreference = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: "light" | "dark"
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "themePreference"
const THEME_EVENT = "theme-preference-changed"

function getStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
}

function getResolvedTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme())
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getResolvedTheme(getStoredTheme()))

  useEffect(() => {
    const applyTheme = (nextTheme: ThemePreference) => {
      const nextResolvedTheme = getResolvedTheme(nextTheme)
      setResolvedTheme(nextResolvedTheme)
      document.documentElement.classList.toggle("dark", nextResolvedTheme === "dark")
    }

    applyTheme(theme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleMediaChange = () => applyTheme(getStoredTheme())
    const handleThemeChange = () => {
      const nextTheme = getStoredTheme()
      setThemeState(nextTheme)
      applyTheme(nextTheme)
    }

    mediaQuery.addEventListener("change", handleMediaChange)
    window.addEventListener("storage", handleThemeChange)
    window.addEventListener(THEME_EVENT, handleThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange)
      window.removeEventListener("storage", handleThemeChange)
      window.removeEventListener(THEME_EVENT, handleThemeChange)
    }
  }, [theme])

  const setTheme = (nextTheme: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}
