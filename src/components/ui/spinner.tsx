import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
} as const

const variantClasses = {
  default: "border-emerald-200 border-t-emerald-600",
  muted: "border-slate-200 border-t-slate-500",
} as const

export type SpinnerSize = keyof typeof sizeClasses
export type SpinnerVariant = keyof typeof variantClasses

interface SpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  className?: string
  label?: string
}

export function Spinner({
  size = "md",
  variant = "default",
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  )
}
