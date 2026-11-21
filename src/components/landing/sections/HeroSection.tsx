import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import { DashboardMock, PhoneEggMock } from "@/components/landing/ui/ProductMocks"
import { landingHeroCopy } from "@/lib/landingContent"

export default function HeroSection() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
      <RevealOnScroll>
        <p className="inline-flex items-center gap-2 rounded-full bg-farm-orange-soft px-3.5 py-1.5 text-[13px] font-semibold text-[#9a4d00]">
          <span className="h-1.5 w-1.5 rounded-full bg-farm-orange" aria-hidden="true" />
          {landingHeroCopy.badge}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.035em] text-farm-ink sm:text-6xl lg:text-[4.25rem]">
          {landingHeroCopy.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-[19px]">
          {landingHeroCopy.subheadline}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-farm-green px-6 text-base font-bold text-white transition-colors hover:bg-farm-green-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-farm-green/30"
          >
            Start 14-day free trial
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <a
            href="#features"
            className="inline-flex h-[52px] items-center justify-center rounded-xl border border-[#dcd6c8] bg-white px-6 text-base font-semibold text-farm-ink transition-colors hover:border-farm-green hover:text-farm-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-farm-green/20"
          >
            See the features
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">No card needed · Cancel anytime</p>
      </RevealOnScroll>

      <RevealOnScroll delayMs={120} className="relative mx-auto mt-14 max-w-5xl pb-10 sm:mt-16">
        <DashboardMock />
        <PhoneEggMock className="absolute -bottom-2 right-2 hidden sm:block lg:-right-12" />
      </RevealOnScroll>
    </section>
  )
}
