import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { howItWorksSteps } from "@/lib/landingContent"

export default function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works">
      <RevealOnScroll>
        <SectionHeading title="Up and running in an afternoon" align="center" />
      </RevealOnScroll>
      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {howItWorksSteps.map((step, i) => (
          <li key={step.title}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-farm-green font-extrabold text-white">
              {i + 1}
            </div>
            <h3 className="mt-5 text-xl font-bold text-farm-ink">{step.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-600">{step.description}</p>
          </li>
        ))}
      </ol>
    </SectionShell>
  )
}
