import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: Props) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-[#9a4d00]">{eyebrow}</p>
      )}
      <h2 className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-farm-ink sm:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
      )}
    </div>
  )
}
