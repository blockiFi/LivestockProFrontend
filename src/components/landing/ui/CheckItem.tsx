import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CheckItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li className={cn("flex items-start gap-2.5", className)}>
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-farm-green" strokeWidth={3} aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}
