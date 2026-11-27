import { useState } from "react"
import { Link } from "react-router-dom"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import CheckItem from "@/components/landing/ui/CheckItem"
import { pricingTiers } from "@/lib/landingContent"
import { cn } from "@/lib/utils"
import { BILLING_CYCLES, cycleInfo, cyclePrice, type BillingCycle } from "@/lib/billingCycles"

const naira = (n: number) => n.toLocaleString("en-NG", { maximumFractionDigits: 0 })

export default function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const info = cycleInfo(cycle)

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

      <div className="mt-9 flex justify-center">
        <div
          role="radiogroup"
          aria-label="How often to pay"
          className="inline-flex w-full max-w-md gap-1 rounded-2xl border border-farm-line bg-white p-1.5 sm:w-auto"
        >
          {BILLING_CYCLES.map((option) => {
            const active = option.cycle === cycle
            return (
              <button
                key={option.cycle}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCycle(option.cycle)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-farm-green/20 sm:flex-row sm:gap-2",
                  active ? "bg-farm-ink text-white" : "text-slate-600 hover:text-farm-ink",
                )}
              >
                {option.short}
                {option.discountPercent > 0 && (
                  <span className={cn("text-xs font-extrabold", active ? "text-farm-orange" : "text-farm-green")}>
                    −{option.discountPercent}%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
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
              <span className="text-[2.5rem] font-extrabold tracking-tight">₦{naira(cyclePrice(tier.price, cycle))}</span>
              <span className={cn("text-[15px]", tier.highlight ? "text-[#bfd3c6]" : "text-slate-500")}> / {info.per}</span>
            </p>
            <p className={cn("mt-1 min-h-5 text-sm", tier.highlight ? "text-[#bfd3c6]" : "text-slate-500")}>
              {cycle === "monthly" ? (
                "Billed monthly"
              ) : (
                <>
                  ₦{naira(Math.round(cyclePrice(tier.price, cycle) / info.months))} a month.{" "}
                  <span className={cn("font-bold", tier.highlight ? "text-farm-orange" : "text-farm-green")}>
                    Save ₦{naira(tier.price * info.months - cyclePrice(tier.price, cycle))}
                  </span>
                </>
              )}
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
