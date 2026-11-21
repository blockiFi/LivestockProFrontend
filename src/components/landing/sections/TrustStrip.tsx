import { Check } from "lucide-react"
import { trustPoints } from "@/lib/landingContent"

export default function TrustStrip() {
  return (
    <section aria-label="Highlights" className="mt-12 border-y border-farm-line bg-white sm:mt-14">
      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-4 px-4 py-6 text-[15px] font-semibold text-farm-charcoal sm:grid-cols-2 sm:px-6 lg:flex lg:justify-between">
        {trustPoints.map((point) => (
          <li key={point} className="flex items-center gap-2.5">
            <Check className="h-5 w-5 shrink-0 text-farm-green" strokeWidth={2.5} aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  )
}
