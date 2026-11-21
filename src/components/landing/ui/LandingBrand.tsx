import emblem from "@/assets/farm-central-emblem.png"
import { cn } from "@/lib/utils"

/** Logo emblem plus a live-text wordmark, sized for the landing nav and footer. */
export default function LandingBrand({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img src={emblem} alt="" className="h-9 w-9 object-contain" width={36} height={36} />
      <span className="text-[19px] font-extrabold tracking-tight">
        <span className={inverted ? "text-[#9fd3b2]" : "text-farm-green"}>Farm</span>
        <span className={inverted ? "text-white" : "text-farm-charcoal"}>Central</span>
      </span>
    </span>
  )
}
