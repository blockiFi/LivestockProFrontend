import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  className?: string
  title?: string
}

export default function BrowserMockup({ children, className, title = "Farm Central Dashboard" }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-emerald-500/10 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-xs text-slate-400">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
