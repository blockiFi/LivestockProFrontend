import logo from "@/assets/farm-central-logo.png"
import { APP_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"

interface LogoProps {
  style?: string
  compact?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-14 w-auto max-w-[180px]",
  md: "h-16 w-auto max-w-[220px]",
  lg: "h-20 w-auto max-w-[280px]",
} as const

const Logo = ({ style, compact = false, size = "md" }: LogoProps) => {
  return (
    <div className={cn("flex items-center", style)}>
      {compact ? (
        <img
          className="h-12 w-12 shrink-0 rounded-full object-cover object-left shadow-sm"
          src={logo}
          alt={APP_NAME}
        />
      ) : (
        <img
          className={cn(
            "shrink-0 object-contain object-left bg-transparent",
            sizeClasses[size]
          )}
          src={logo}
          alt={APP_NAME}
        />
      )}
    </div>
  )
}

export default Logo
