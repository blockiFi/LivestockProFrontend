import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll"

type Props = {
  children: ReactNode
  className?: string
  delayMs?: number
}

export default function RevealOnScroll({ children, className, delayMs = 0 }: Props) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}
