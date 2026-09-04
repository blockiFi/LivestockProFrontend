import { createContext, useContext, useEffect, useMemo } from "react"

type ThemePreference = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: "light"
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "themePreference"

function forceLightMode() {
  document.documentElement.classList.remove("dark")
  document.documentElement.style.colorScheme = "light"
  localStorage.setItem(STORAGE_KEY, "light")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    forceLightMode()
  }, [])

  // Dark mode is disabled for now — always light.
  const setTheme = (_nextTheme: ThemePreference) => {
    forceLightMode()
  }

  const value = useMemo(
    () => ({
      theme: "light" as const,
      resolvedTheme: "light" as const,
      setTheme,
    }),
    []
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
