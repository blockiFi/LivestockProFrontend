import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import CheckItem from "@/components/landing/ui/CheckItem"
import { FeatureMock } from "@/components/landing/ui/ProductMocks"
import { extraModules, featureDeepDives } from "@/lib/landingContent"
import { cn } from "@/lib/utils"

export default function FeaturesSection() {
  return (
    <SectionShell id="features">
      <RevealOnScroll>
        <SectionHeading eyebrow="Features" title="Built around how a farm actually runs" />
      </RevealOnScroll>

      <div className="mt-14 flex flex-col gap-20 sm:mt-16 sm:gap-24">
        {featureDeepDives.map((feature, i) => {
          return (
            <div key={feature.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <RevealOnScroll className={cn(i % 2 === 1 && "lg:order-2")}>
                <h3 className="text-2xl font-extrabold tracking-tight text-farm-ink sm:text-[1.75rem]">
                  {feature.title}
                </h3>
                <p className="mt-3.5 text-[17px] leading-[1.65] text-slate-600">{feature.description}</p>
                <ul className="mt-5 flex flex-col gap-2.5 text-[15px] text-[#2b3036]">
                  {feature.points.map((point) => (
                    <CheckItem key={point}>{point}</CheckItem>
                  ))}
                </ul>
              </RevealOnScroll>
              <RevealOnScroll delayMs={100} className={cn(i % 2 === 1 && "lg:order-1")}>
                <FeatureMock id={feature.id} />
              </RevealOnScroll>
            </div>
          )
        })}
      </div>

      <div className="mt-20 flex flex-wrap items-center gap-x-9 gap-y-3 rounded-2xl border border-farm-line bg-white p-6 sm:mt-24 sm:p-7">
        <span className="text-[15px] font-bold text-farm-ink">Also included:</span>
        {extraModules.map((m) => (
          <span key={m} className="text-[15px] text-farm-charcoal">
            {m}
          </span>
        ))}
      </div>
    </SectionShell>
  )
}
