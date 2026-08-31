import logo from "@/assets/livestockpro1.png"
import { cn } from "@/lib/utils"

interface LogoProps {
  style?: string
  compact?: boolean
  variant?: "light" | "dark"
}

const Logo = ({ style, compact = false, variant = "light" }: LogoProps) => {
  const isDark = variant === "dark"

  return (
    <div className={cn("flex items-center gap-3", style)}>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
          isDark
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 ring-1 ring-emerald-400/30"
            : "bg-gradient-to-br from-emerald-100 to-emerald-200 ring-1 ring-emerald-200"
        )}
      >
        <img className="h-5 w-5 object-contain" src={logo} alt="LiveStockPro" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p
            className={cn(
              "text-lg font-bold leading-tight tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            LiveStockPro
          </p>
          <p className={cn("text-[11px] font-medium", isDark ? "text-emerald-200/70" : "text-emerald-700")}>
            Farm management
          </p>
        </div>
      )}
    </div>
  )
}

export default Logo
