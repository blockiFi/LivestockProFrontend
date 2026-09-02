import { Link } from "react-router-dom"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { pricingTiers } from "@/lib/landingContent"

export default function PricingSection() {
  return (
    <SectionShell id="pricing" className="border-t border-slate-800 bg-slate-900">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, billed per farm"
          description="Every plan starts with a 14-day free trial. Change or cancel at any time — no hidden fees and no long-term contracts."
          align="center"
          className="mx-auto"
        />
      </RevealOnScroll>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {pricingTiers.map((tier, i) => (
          <RevealOnScroll key={tier.name} delayMs={i * 80}>
            <Card
              className={`h-full border-slate-800 bg-slate-950/70 backdrop-blur transition-all hover:-translate-y-1 hover:border-emerald-500/30 motion-reduce:hover:translate-y-0 ${
                tier.highlight ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <CardContent className="flex h-full flex-col p-6">
                {tier.highlight && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Most complete
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{tier.tagline}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold text-white">₦{tier.price}</span>
                  <span className="text-sm text-slate-400"> /month per farm</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button
                    className={`w-full rounded-xl ${
                      tier.highlight
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-emerald-950 hover:from-green-500 hover:to-emerald-600"
                        : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    }`}
                  >
                    Start free trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </RevealOnScroll>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        No credit card required to start · Cancel anytime
      </p>
    </SectionShell>
  )
}
