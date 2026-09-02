import { MessageSquareQuote } from "lucide-react"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { testimonials } from "@/lib/landingContent"

export default function TestimonialsSection() {
  if (testimonials.length === 0) {
    return (
      <SectionShell className="border-t border-slate-800 bg-slate-950">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
            <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-600" />
            <SectionHeading
              title="Customer stories coming soon"
              description="We're gathering testimonials from farms using the platform. Real reviews will appear here — no placeholder quotes."
              align="center"
              className="mx-auto mt-4"
            />
          </div>
        </RevealOnScroll>
      </SectionShell>
    )
  }

  return (
    <SectionShell className="border-t border-slate-800 bg-slate-950">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by modern farm operators"
          align="center"
          className="mx-auto"
        />
      </RevealOnScroll>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <blockquote
            key={t.name + t.company}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <p className="text-sm leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
            <footer className="mt-4">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-slate-500">
                {t.role}, {t.company}
              </p>
            </footer>
          </blockquote>
        ))}
      </div>
    </SectionShell>
  )
}
