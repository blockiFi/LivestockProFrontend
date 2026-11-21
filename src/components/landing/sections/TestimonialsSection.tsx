import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { testimonials } from "@/lib/landingContent"

/** Renders nothing until real quotes are added to `testimonials` in landingContent.ts. */
export default function TestimonialsSection() {
  if (testimonials.length === 0) return null

  return (
    <SectionShell>
      <RevealOnScroll>
        <SectionHeading eyebrow="From farmers" title="What farms say about Farm Central" align="center" />
      </RevealOnScroll>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <blockquote key={t.name + t.company} className="rounded-2xl border border-farm-line bg-white p-7">
            <p className="text-base leading-relaxed text-[#2b3036]">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-5">
              <p className="text-sm font-bold text-farm-ink">{t.name}</p>
              <p className="text-sm text-slate-500">
                {t.role}, {t.company}
              </p>
            </footer>
          </blockquote>
        ))}
      </div>
    </SectionShell>
  )
}
