import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Illustrated previews of Farm Central screens for the landing page.
 * They use sample data only and are hidden from screen readers; each wrapper
 * carries a text label describing what it shows.
 */

const card = "rounded-xl border border-[#ece7dc] bg-white"

const sidebarItems = [
  "Dashboard",
  "Flocks",
  "Egg collection",
  "Feed",
  "Health schedules",
  "Inventory",
  "Tasks",
  "Sales and expenses",
]

const kpis = [
  { label: "Active birds", value: "12,480", sub: "6 active flocks", good: true },
  { label: "Eggs this week", value: "297 crates", sub: "8,920 eggs", good: false },
  { label: "Mortality", value: "1.8%", sub: "Within target", good: true },
  { label: "Net profit", value: "₦1.1M", sub: "26% margin", good: false },
]

const weeklyEggs = [58, 64, 61, 72, 78, 75, 86, 92]

export function DashboardMock({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Farm Central dashboard with bird count, eggs collected, mortality, profit, a weekly egg chart and alerts (sample data)"
      className={cn(
        "overflow-hidden rounded-2xl border border-[#e3ded2] bg-white text-left shadow-[0_30px_80px_-30px_rgba(20,38,27,0.35)]",
        className,
      )}
    >
      <div aria-hidden="true">
        <div className="flex items-center gap-1.5 border-b border-[#eeeae0] bg-[#f6f3ec] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e1dbcd]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e1dbcd]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e1dbcd]" />
          <span className="ml-3 text-xs text-slate-500">Farm overview · sample data</span>
        </div>
        <div className="flex min-h-[380px]">
          <div className="hidden w-48 shrink-0 flex-col gap-1 border-r border-[#eeeae0] p-4 text-[13px] text-slate-600 md:flex">
            {sidebarItems.map((item, i) => (
              <div
                key={item}
                className={cn("rounded-lg px-3 py-2", i === 0 && "bg-farm-mint font-bold text-farm-green")}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4 bg-[#fcfbf8] p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className={cn(card, "p-3.5")}>
                  <div className="text-xs text-slate-500">{kpi.label}</div>
                  <div className="mt-1.5 text-lg font-extrabold text-farm-ink sm:text-2xl">{kpi.value}</div>
                  <div className={cn("text-xs", kpi.good ? "text-farm-green" : "text-slate-500")}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className={cn(card, "flex-[2] p-4")}>
                <div className="text-[13px] font-bold text-farm-ink">Egg production, last 8 weeks</div>
                <div className="mt-4 flex h-36 items-end gap-2.5">
                  {weeklyEggs.map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t-md",
                        i === weeklyEggs.length - 1 ? "bg-farm-green" : "bg-[#cfe3d6]",
                      )}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className={cn(card, "flex flex-1 flex-col gap-2.5 p-4 text-xs")}>
                <div className="text-[13px] font-bold text-farm-ink">Needs attention</div>
                <div className="rounded-lg bg-farm-orange-soft p-2.5 text-[#7a3e00]">
                  <b>Newcastle vaccine due</b>
                  <br />
                  Batch 244 · in 2 days
                </div>
                <div className="rounded-lg bg-[#f4f1ea] p-2.5 text-farm-charcoal">
                  <b>Finisher feed low</b>
                  <br />2 bags left
                </div>
                <div className="rounded-lg bg-[#f4f1ea] p-2.5 text-farm-charcoal">
                  <b>House B cleaning overdue</b>
                  <br />
                  Assigned to staff
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const roundCells = ["done", "done", "done", "partial", "flag", "todo"] as const

export function PhoneEggMock({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Phone screen recording eggs by cell for House A, round 2 of 3 (sample data)"
      className={cn("w-52 rounded-[30px] bg-farm-ink p-2.5 shadow-[0_24px_60px_-20px_rgba(20,38,27,0.5)]", className)}
    >
      <div aria-hidden="true" className="flex flex-col gap-2.5 rounded-[22px] bg-white px-3.5 py-4 text-left">
        <div className="text-[11px] text-slate-500">Record eggs · House A</div>
        <div className="text-[15px] font-extrabold text-farm-ink">Round 2 of 3</div>
        <div className="grid grid-cols-3 gap-1.5">
          {roundCells.map((state, i) => (
            <div
              key={i}
              className={cn(
                "h-8 rounded-lg",
                state === "done" && "bg-farm-green",
                state === "partial" && "bg-[#cfe3d6]",
                state === "flag" && "bg-farm-orange",
                state === "todo" && "bg-[#eeeae0]",
              )}
            />
          ))}
        </div>
        <div className="text-[11px] text-slate-600">4 of 6 cells done · 1,140 eggs</div>
        <div className="rounded-[10px] bg-farm-green py-2.5 text-center text-xs font-bold text-white">Save round</div>
      </div>
    </div>
  )
}

const houseCells = [
  "#1e5a36", "#2f7a4d", "#1e5a36", "#7fb394", "#1e5a36", "#2f7a4d",
  "#2f7a4d", "#f08a1c", "#1e5a36", "#2f7a4d", "#1e5a36", "#7fb394",
]

function MockFrame({ tone, label, children }: { tone: "green" | "orange"; label: string; children: ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex aspect-[4/3] w-full items-center justify-center rounded-2xl border p-5 sm:p-8",
        tone === "green" ? "border-[#dce8df] bg-[#eef4ef]" : "border-[#f5e1c8] bg-[#fff4e6]",
      )}
    >
      <div
        aria-hidden="true"
        className="w-full rounded-xl bg-white p-4 text-left shadow-[0_16px_40px_-20px_rgba(20,38,27,0.35)] sm:p-5"
      >
        {children}
      </div>
    </div>
  )
}

function ProductionMock() {
  return (
    <MockFrame tone="green" label="House layout showing eggs collected per cell, with one under-laying cell highlighted (sample data)">
      <div className="text-[13px] font-bold text-farm-ink">House A layout · eggs by cell</div>
      <div className="mt-3.5 grid grid-cols-6 gap-1.5">
        {houseCells.map((c, i) => (
          <div key={i} className="h-9 rounded-md sm:h-10" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-farm-green" />On target</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-farm-orange" />Below target</span>
      </div>
    </MockFrame>
  )
}

const schedule = [
  { name: "Gumboro vaccine", status: "Done", tone: "done" },
  { name: "Newcastle vaccine", status: "In 2 days", tone: "due" },
  { name: "Grower feed switch", status: "Week 7", tone: "later" },
] as const

function HealthMock() {
  return (
    <MockFrame tone="orange" label="Health schedule for batch 244 with one vaccine done and one due in two days (sample data)">
      <div className="text-[13px] font-bold text-farm-ink">Health schedule · Batch 244</div>
      <div className="mt-3 flex flex-col gap-2.5">
        {schedule.map((s) => (
          <div
            key={s.name}
            className={cn(
              "flex justify-between rounded-lg px-3 py-2.5 text-[13px]",
              s.tone === "due" ? "bg-farm-orange-soft" : "bg-[#f4f1ea]",
            )}
          >
            <span>{s.name}</span>
            <span
              className={cn(
                "font-bold",
                s.tone === "done" && "text-farm-green",
                s.tone === "due" && "text-[#9a4d00]",
                s.tone === "later" && "font-normal text-slate-600",
              )}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

const stock = [
  { name: "Layer mash", qty: "38 bags", pct: 76, low: false },
  { name: "Finisher feed", qty: "2 bags", pct: 8, low: true },
  { name: "Newcastle vaccine", qty: "12 vials", pct: 48, low: false },
]

function InventoryMock() {
  return (
    <MockFrame tone="green" label="Inventory levels with finisher feed flagged as low (sample data)">
      <div className="text-[13px] font-bold text-farm-ink">Inventory</div>
      <div className="mt-3 flex flex-col gap-3.5">
        {stock.map((s) => (
          <div key={s.name} className="text-[13px]">
            <div className="flex justify-between">
              <span>{s.name}</span>
              <span className={s.low ? "font-bold text-[#9a4d00]" : "text-slate-600"}>{s.qty}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-[#eeeae0]">
              <div
                className={cn("h-2 rounded-full", s.low ? "bg-farm-orange" : "bg-farm-green")}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

function FinanceMock() {
  return (
    <MockFrame tone="orange" label="Profit and loss for batch 244: revenue 4.2 million naira, costs 3.1 million, profit 1.1 million (sample data)">
      <div className="text-[13px] font-bold text-farm-ink">Batch 244 · profit and loss</div>
      <div className="mt-3.5 grid grid-cols-3 gap-2.5">
        {[
          ["Revenue", "₦4.2M", false],
          ["Costs", "₦3.1M", false],
          ["Profit", "₦1.1M", true],
        ].map(([label, value, good]) => (
          <div key={label as string}>
            <div className="text-xs text-slate-500">{label}</div>
            <div className={cn("text-lg font-extrabold sm:text-xl", good ? "text-farm-green" : "text-farm-ink")}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex h-3 overflow-hidden rounded-full">
        <div className="w-[58%] bg-farm-green" />
        <div className="w-[16%] bg-[#7fb394]" />
        <div className="w-[26%] bg-farm-orange" />
      </div>
      <div className="mt-2 text-xs text-slate-600">Feed 58% · Health 16% · Other 26%</div>
    </MockFrame>
  )
}

const featureMocks = {
  production: ProductionMock,
  health: HealthMock,
  inventory: InventoryMock,
  finance: FinanceMock,
} as const

export function FeatureMock({ id }: { id: keyof typeof featureMocks }) {
  const Mock = featureMocks[id]
  return <Mock />
}
