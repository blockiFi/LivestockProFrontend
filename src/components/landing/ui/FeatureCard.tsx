import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export default function FeatureCard({ icon: Icon, title, description, className }: Props) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-emerald-500/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/10 transition-colors group-hover:from-emerald-500/30">
        <Icon className="h-5 w-5 text-emerald-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
    </div>
  )
}
