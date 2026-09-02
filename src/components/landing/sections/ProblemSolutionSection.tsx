import { CheckCircle, XCircle } from "lucide-react"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import LandingImage from "@/components/landing/ui/LandingImage"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import { problemPoints, solutionPoints } from "@/lib/landingContent"
import { landingImages } from "@/lib/landingImages"
import { APP_NAME } from "@/lib/brand"

export default function ProblemSolutionSection() {
  return (
    <SectionShell id="solutions" className="border-t border-slate-800 bg-slate-950">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="The challenge"
            title="Farm operations break down when data lives everywhere"
            description="Most farms still rely on notebooks, spreadsheets, and memory — making it hard to run a profitable, accountable operation."
          />
          <ul className="mt-8 space-y-3">
            {problemPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/80" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100}>
          <div className="relative overflow-hidden rounded-2xl border border-slate-800">
            <LandingImage image={landingImages.problem} className="aspect-[4/3]" />
          </div>
        </RevealOnScroll>
      </div>

      <RevealOnScroll className="mt-16">
        <SectionHeading
          eyebrow="The solution"
          title={`How ${APP_NAME} solves it`}
          description="One platform connects livestock, feed, health, inventory, tasks, and finances — so you always know what's happening on your farm."
          align="center"
          className="mx-auto"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutionPoints.map((item, i) => (
            <RevealOnScroll key={item.title} delayMs={i * 60} className="h-full">
              <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-emerald-500/30 hover:bg-slate-900/80">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </RevealOnScroll>
    </SectionShell>
  )
}
