import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  children: ReactNode
  className?: string
  containerClassName?: string
}

export default function SectionShell({ id, children, className, containerClassName }: Props) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 sm:py-24", className)}>
      <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", containerClassName)}>{children}</div>
    </section>
  )
}
