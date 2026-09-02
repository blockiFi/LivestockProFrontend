import FeatureCard from "@/components/landing/ui/FeatureCard"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { featureItems } from "@/lib/landingContent"
import { APP_NAME } from "@/lib/brand"

export default function FeaturesSection() {
  return (
    <SectionShell id="features" className="border-t border-slate-800 bg-slate-900">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Platform capabilities"
          title={`Everything you need to run ${APP_NAME}`}
          description="Purpose-built modules for poultry and livestock — from batch records to analytics, not a generic spreadsheet with a farm label."
          align="center"
          className="mx-auto"
        />
      </RevealOnScroll>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featureItems.map((feature, i) => (
          <RevealOnScroll key={feature.title} delayMs={i * 40} className={feature.className}>
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className="h-full"
            />
          </RevealOnScroll>
        ))}
      </div>
    </SectionShell>
  )
}
