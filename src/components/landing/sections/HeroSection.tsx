import { Link } from "react-router-dom"
import { ArrowRight, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import BrowserMockup from "@/components/landing/ui/BrowserMockup"
import LandingImage from "@/components/landing/ui/LandingImage"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import { dashboardPreviewKpis, landingHeroCopy } from "@/lib/landingContent"
import { landingImages } from "@/lib/landingImages"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 pb-28 md:grid-cols-2 md:items-center md:py-28 md:pb-36">
        <RevealOnScroll>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/60 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {landingHeroCopy.badge}
          </div>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {landingHeroCopy.headline.split("one command center")[0]}
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              one command center
            </span>
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
            {landingHeroCopy.subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-green-500 hover:to-emerald-600"
              >
                Start Managing Your Farm
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-slate-700 bg-slate-900/60 text-base text-slate-100 hover:bg-slate-900"
              >
                See How It Works
                <Monitor className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120} className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl shadow-emerald-500/10">
            <LandingImage image={landingImages.hero} priority className="aspect-[4/3] min-h-[280px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 sm:-bottom-8 sm:left-auto sm:right-0 sm:w-[92%]">
            <BrowserMockup title="Farm overview — sample data">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dashboardPreviewKpis.slice(0, 3).map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{kpi.label}</p>
                    <p className={`mt-1 text-sm font-semibold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-slate-500">{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </BrowserMockup>
          </div>
        </RevealOnScroll>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
    </section>
  )
}
