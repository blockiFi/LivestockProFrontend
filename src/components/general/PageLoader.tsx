import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  label?: string
  className?: string
}

export function PageLoader({ label = "Loading…", className }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center",
        "bg-slate-50/70 backdrop-blur-[2px]",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-8 py-7 shadow-lg shadow-slate-200/50">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-14 w-14 animate-pulse rounded-full bg-emerald-100/60" />
          <Spinner size="lg" label={label} />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  )
}
