import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionShell from "@/components/landing/ui/SectionShell"

export default function FinalCtaSection() {
  return (
    <SectionShell className="border-t border-slate-800 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950">
      <RevealOnScroll>
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900/60 px-6 py-14 text-center backdrop-blur sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
          <h2 className="relative text-balance text-3xl font-bold text-white sm:text-4xl">
            Take control of your farm operations
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-pretty text-base text-slate-300 sm:text-lg">
            Manage your livestock, people, inventory, finances, and daily operations from one powerful
            platform.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full min-w-[200px] rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-green-500 hover:to-emerald-600 sm:w-auto"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#contact">
              <Button
                variant="outline"
                size="lg"
                className="w-full min-w-[200px] rounded-xl border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 sm:w-auto"
              >
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </RevealOnScroll>
    </SectionShell>
  )
}
