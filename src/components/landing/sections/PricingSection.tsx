import { Link } from "react-router-dom"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import CheckItem from "@/components/landing/ui/CheckItem"
import { pricingTiers } from "@/lib/landingContent"
import { cn } from "@/lib/utils"

export default function PricingSection() {
  return (
    <SectionShell id="pricing">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, per farm"
          description="Every plan starts with a 14-day free trial. No card needed, cancel anytime."
          align="center"
        />
      </RevealOnScroll>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-2xl p-7 sm:p-8",
              tier.highlight ? "bg-farm-ink text-white" : "border border-farm-line bg-white text-farm-ink",
            )}
          >
            {tier.highlight && (
              <span className="absolute right-5 top-5 rounded-full bg-farm-orange px-3 py-1 text-xs font-extrabold text-[#1f1300]">
                Most complete
              </span>
            )}
            <h3 className="text-xl font-bold">{tier.name}</h3>
            <p className={cn("mt-1.5 text-sm", tier.highlight ? "text-[#bfd3c6]" : "text-slate-500")}>{tier.tagline}</p>
            <p className="mt-6">
              <span className="text-[2.5rem] font-extrabold tracking-tight">₦{tier.price}</span>
              <span className={cn("text-[15px]", tier.highlight ? "text-[#bfd3c6]" : "text-slate-500")}> / month</span>
            </p>
            <ul className={cn("mt-6 flex flex-1 flex-col gap-2.5 text-[15px]", tier.highlight ? "text-[#e6efe9]" : "text-[#2b3036]")}>
              {tier.points.map((point) => (
                <CheckItem key={point} className={tier.highlight ? "[&_svg]:text-farm-orange" : undefined}>
                  {point}
                </CheckItem>
              ))}
            </ul>
            <Link
              to="/register"
              className={cn(
                "mt-7 flex h-12 items-center justify-center rounded-xl text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4",
                tier.highlight
                  ? "bg-farm-orange text-[#1f1300] hover:bg-[#f6a043] focus-visible:ring-farm-orange/40"
                  : "border border-[#dcd6c8] text-farm-ink hover:border-farm-green hover:text-farm-green focus-visible:ring-farm-green/20",
              )}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
