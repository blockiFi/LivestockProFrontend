import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import LandingImage from "@/components/landing/ui/LandingImage"
import { benefitItems } from "@/lib/landingContent"
import { landingImages } from "@/lib/landingImages"

export default function BenefitsSection() {
  return (
    <SectionShell className="border-t border-slate-800 bg-slate-950">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="Outcomes"
            title="Built for farms that want better results"
            description="Focus on what matters — healthier livestock, lower waste, stronger teams, and clearer profitability."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefitItems.map((item, i) => (
              <RevealOnScroll key={item.title} delayMs={i * 50}>
                <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-emerald-500/20">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120}>
          <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl shadow-emerald-500/5">
            <LandingImage image={landingImages.benefits} className="aspect-[4/5] min-h-[320px]" />
          </div>
        </RevealOnScroll>
      </div>
    </SectionShell>
  )
}
