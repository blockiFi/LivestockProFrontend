import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { howItWorksSteps } from "@/lib/landingContent"

export default function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works" className="border-t border-slate-800 bg-slate-900">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="How it works"
          title="From setup to smarter decisions in four steps"
          description="A clear workflow that takes your team from onboarding to daily operations to actionable insights."
          align="center"
          className="mx-auto"
        />
      </RevealOnScroll>

      <div className="relative mt-14">
        <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent md:left-1/2 md:block md:-translate-x-1/2" />

        <div className="space-y-8 md:space-y-12">
          {howItWorksSteps.map((step, i) => (
            <RevealOnScroll key={step.step} delayMs={i * 80}>
              <div
                className={`relative flex flex-col gap-4 md:flex-row md:items-center ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="md:w-1/2 md:px-8">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition-colors hover:border-emerald-500/30">
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Step {step.step}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>
                  </div>
                </div>
                <div className="hidden md:flex md:w-1/2 md:justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-slate-950 text-sm font-bold text-emerald-400 shadow-lg shadow-emerald-500/10">
                    {step.step}
                  </div>
                </div>
                <div className="md:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-slate-950 text-xs font-bold text-emerald-400">
                    {step.step}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
