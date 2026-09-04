import type { ReactNode } from "react"
import { Spinner, type SpinnerSize } from "@/components/ui/spinner"
import { PageLoader } from "@/components/general/PageLoader"
import { cn } from "@/lib/utils"

type LoadingVariant = "page" | "section" | "inline" | "centered" | "button"

interface LoadingStateProps {
  variant?: LoadingVariant
  loading?: boolean
  label?: string
  className?: string
  children?: ReactNode
  spinnerSize?: SpinnerSize
}

function LoadingIndicator({
  label,
  size = "md",
  className,
}: {
  label?: string
  size?: SpinnerSize
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      <Spinner size={size} label={label ?? "Loading"} />
      {label && variantLabelVisible(size) && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  )
}

function variantLabelVisible(size: SpinnerSize) {
  return size !== "sm"
}

export function LoadingState({
  variant = "centered",
  loading = true,
  label = "Loading…",
  className,
  children,
  spinnerSize,
}: LoadingStateProps) {
  if (variant === "page") {
    if (!loading) return null
    return <PageLoader label={label} className={className} />
  }

  if (variant === "button") {
    if (!loading) return null
    return (
      <Spinner
        size={spinnerSize ?? "sm"}
        className={cn("shrink-0", className)}
        label={label}
      />
    )
  }

  if (variant === "inline") {
    if (!loading) return null
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Spinner size={spinnerSize ?? "sm"} label={label} />
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </span>
    )
  }

  if (variant === "centered") {
    if (!loading) return null
    return (
      <LoadingIndicator
        label={label}
        size={spinnerSize ?? "md"}
        className={cn("py-10", className)}
      />
    )
  }

  // section — overlay on children
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center",
            "rounded-[inherit] bg-white/75 backdrop-blur-[1px]"
          )}
        >
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-6 py-5 shadow-md">
            <Spinner size={spinnerSize ?? "md"} label={label} />
            {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
