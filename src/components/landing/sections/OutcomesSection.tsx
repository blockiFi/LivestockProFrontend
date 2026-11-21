import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { outcomes } from "@/lib/landingContent"

export default function OutcomesSection() {
  return (
    <SectionShell id="why" className="pt-24 sm:pt-28">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Why farms switch"
          title="Notebooks and spreadsheets can't tell you what's going wrong in time"
        />
      </RevealOnScroll>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {outcomes.map(({ icon: Icon, title, before, after }) => (
          <div key={title} className="rounded-2xl border border-farm-line bg-white p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-farm-mint">
              <Icon className="h-[22px] w-[22px] text-farm-green" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-farm-ink">{title}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#6b5e4b]">
              <span className="sr-only">Before: </span>
              <s>{before}</s>
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-[#2b3036]">
              <span className="sr-only">With Farm Central: </span>
              {after}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
