import BrowserMockup from "@/components/landing/ui/BrowserMockup"
import RevealOnScroll from "@/components/landing/ui/RevealOnScroll"
import SectionHeading from "@/components/landing/ui/SectionHeading"
import SectionShell from "@/components/landing/ui/SectionShell"
import { dashboardPreviewAlerts, dashboardPreviewKpis } from "@/lib/landingContent"

export default function DashboardShowcaseSection() {
  return (
    <SectionShell id="showcase" className="border-t border-slate-800 bg-slate-950">
      <RevealOnScroll>
        <SectionHeading
          eyebrow="Product preview"
          title="See your farm at a glance"
          description="A unified dashboard for flock statistics, feed consumption, mortality, production, finances, tasks, and alerts — sample data shown for illustration."
          align="center"
          className="mx-auto"
        />
      </RevealOnScroll>

      <RevealOnScroll delayMs={100} className="mt-12">
        <BrowserMockup title="farmcentral.app/dashboard — product preview">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white">Green Valley Poultry Farm</p>
              <p className="text-xs text-slate-500">Lifetime overview · sample data</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
              Demo preview
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {dashboardPreviewKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 transition-colors hover:border-slate-700"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{kpi.label}</p>
                <p className={`mt-1 text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-slate-500">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="mb-3 text-xs font-medium text-slate-400">Production trend (sample)</p>
              <div className="flex h-24 items-end gap-1">
                {[40, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-emerald-600/40 to-emerald-400/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="mb-3 text-xs font-medium text-slate-400">Upcoming alerts</p>
              <ul className="space-y-2">
                {dashboardPreviewAlerts.map((alert) => (
                  <li
                    key={alert.title}
                    className="flex items-start justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-200">{alert.title}</p>
                      <p className="text-[10px] text-slate-500">{alert.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-amber-300">
                      {alert.tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </BrowserMockup>
      </RevealOnScroll>
    </SectionShell>
  )
}
