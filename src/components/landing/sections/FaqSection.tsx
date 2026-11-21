import { ChevronDown } from "lucide-react"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { faqItems } from "@/lib/landingContent"

export default function FaqSection() {
  return (
    <SectionShell id="faq" containerClassName="max-w-3xl">
      <SectionHeading title="Questions farmers ask" align="center" />
      <div className="mt-10 flex flex-col gap-3">
        {faqItems.map((item, i) => (
          <details
            key={item.question}
            open={i === 0}
            className="group rounded-2xl border border-farm-line bg-white px-5 py-1 open:pb-4 sm:px-6"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[17px] font-bold text-farm-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <p className="text-[15px] leading-relaxed text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  )
}
