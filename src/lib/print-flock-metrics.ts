import type { DetailedFlockRecord, FlockAiInsights, FlockProfitLoss } from "@/lib/types"
import { buildFlockMetrics } from "@/lib/flockMetrics"
import { formatCurrency } from "@/lib/utils"
import { getCategoryLabel } from "@/lib/expenditureCategories"

export type FlockMetricsPrintInput = {
  flock: DetailedFlockRecord
  profitLoss?: FlockProfitLoss | null
  daysInFlock: number
  currentAge: number
  farmName?: string | null
  aiInsights?: FlockAiInsights | null
  aiAnalysis?: string | null
  generatedAt?: Date
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function listItems(items: string[]): string {
  if (items.length === 0) return "<p class=\"muted\">None listed.</p>"
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

function trendTable(title: string, headers: [string, string], rows: { label: string; value: number }[], valueSuffix = ""): string {
  if (rows.length === 0) return ""
  const body = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td class="right">${escapeHtml(`${row.value.toLocaleString()}${valueSuffix}`)}</td></tr>`
    )
    .join("")
  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr><th>${escapeHtml(headers[0])}</th><th class="right">${escapeHtml(headers[1])}</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </section>`
}

export function buildFlockMetricsPrintHtml(input: FlockMetricsPrintInput): string {
  const { flock, profitLoss, daysInFlock, currentAge, farmName, aiInsights, aiAnalysis, generatedAt } = input
  const metrics = buildFlockMetrics(flock, profitLoss, daysInFlock, currentAge)
  const { kpis, trends, ruleInsights } = metrics
  const generatedLabel = (generatedAt ?? new Date()).toLocaleString()
  const naira = "₦"

  const kpiRows = [
    ["Survival Rate", `${kpis.survivalRate.toFixed(1)}%`],
    ["Mortality Rate", `${kpis.mortalityRate.toFixed(1)}%`],
    ["Birds Remaining", kpis.birdsRemaining.toLocaleString()],
    ["Total Mortality", kpis.totalMortality.toLocaleString()],
    ["Days in Flock", String(daysInFlock)],
    ["Current Age", `${currentAge} days`],
    ["Total Feed", `${kpis.totalFeedKg.toFixed(1)} kg`],
    ["Feed per Bird", `${kpis.feedPerBird.toFixed(2)} kg`],
    ...(kpis.fcr != null ? [["FCR", kpis.fcr.toFixed(2)]] : []),
    ...(kpis.averageDailyGain != null ? [["Avg Daily Gain", `${kpis.averageDailyGain.toFixed(0)} g/day`]] : []),
    ...(kpis.latestWeightGrams != null ? [["Latest Weight", `${kpis.latestWeightGrams.toFixed(0)} g`]] : []),
    ...(kpis.totalEggs > 0 ? [["Total Eggs", kpis.totalEggs.toLocaleString()]] : []),
    ...(kpis.henDayProduction != null ? [["Hen-day Production", `${kpis.henDayProduction.toFixed(1)}%`]] : []),
    ["Total Revenue", `${naira}${formatCurrency(kpis.totalRevenue)}`],
    ["Total Cost", `${naira}${formatCurrency(kpis.totalCost)}`],
    ["Net Profit", `${naira}${formatCurrency(kpis.netProfit)}`],
    ["Margin", `${kpis.marginPercent.toFixed(1)}%`],
    ["Birds Sold", kpis.birdsSold.toLocaleString()],
  ]
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="right bold">${escapeHtml(value)}</td></tr>`)
    .join("")

  const financialRows = trends.financial
    .map(
      (row) =>
        `<tr><td>${escapeHtml(getCategoryLabel(row.category))}</td><td class="right">${escapeHtml(`${naira}${formatCurrency(row.total_cost)}`)}</td></tr>`
    )
    .join("")

  const aiSection = aiInsights
    ? `
      <section class="section ai-box">
        <h2>AI Performance Analysis</h2>
        <p><span class="badge badge-${escapeHtml(aiInsights.performance_score)}">${escapeHtml(aiInsights.performance_score.toUpperCase())}</span></p>
        <p>${escapeHtml(aiInsights.executive_summary)}</p>
        <div class="two-col">
          <div>
            <h3>Strengths</h3>
            ${listItems(aiInsights.strengths)}
          </div>
          <div>
            <h3>Risks</h3>
            ${listItems(aiInsights.risks)}
          </div>
        </div>
        ${
          aiInsights.recommendations.length > 0
            ? `<h3>Recommendations</h3><table>
                <thead><tr><th>Priority</th><th>Action</th><th>Reason</th></tr></thead>
                <tbody>${aiInsights.recommendations
                  .map(
                    (rec) =>
                      `<tr><td>${escapeHtml(rec.priority)}</td><td>${escapeHtml(rec.action)}</td><td>${escapeHtml(rec.reason)}</td></tr>`
                  )
                  .join("")}</tbody>
              </table>`
            : ""
        }
        ${aiInsights.benchmark_comparison ? `<p class="muted"><strong>Benchmark:</strong> ${escapeHtml(aiInsights.benchmark_comparison)}</p>` : ""}
      </section>`
    : aiAnalysis
      ? `<section class="section ai-box"><h2>AI Performance Analysis</h2><p>${escapeHtml(aiAnalysis)}</p></section>`
      : ""

  const insightsSection =
    ruleInsights.length > 0
      ? `<section class="section"><h2>Key Insights</h2><ul>${ruleInsights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : ""

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Flock Metrics — ${escapeHtml(flock.name)}</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #111827;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page { max-width: 210mm; margin: 0 auto; padding: 8mm 0 12mm; }
      .header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #059669; padding-bottom: 16px; }
      .title { margin: 0; font-size: 24px; color: #047857; }
      .subtitle { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
      .meta { text-align: right; font-size: 12px; color: #4b5563; }
      .section { margin-bottom: 22px; }
      h2 { margin: 0 0 10px; font-size: 16px; color: #065f46; }
      h3 { margin: 12px 0 8px; font-size: 13px; color: #374151; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f0fdf4; color: #065f46; font-weight: 600; }
      .right { text-align: right; }
      .bold { font-weight: 600; }
      .muted { color: #6b7280; font-size: 12px; }
      ul { margin: 0; padding-left: 18px; }
      li { margin-bottom: 4px; font-size: 12px; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .ai-box { background: #f8fafc; border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
      .badge-good { background: #d1fae5; color: #065f46; }
      .badge-fair { background: #fef3c7; color: #92400e; }
      .badge-poor { background: #ffe4e6; color: #9f1239; }
      .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; text-align: center; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <h1 class="title">Flock Performance Report</h1>
          <p class="subtitle">${escapeHtml(flock.name)} · Batch ${escapeHtml(flock.batch_number)} · ${escapeHtml(flock.poultry_type?.name ?? "Poultry")}</p>
        </div>
        <div class="meta">
          ${farmName ? `<div><strong>${escapeHtml(farmName)}</strong></div>` : ""}
          <div>Generated ${escapeHtml(generatedLabel)}</div>
          <div>Status: ${escapeHtml(flock.status)}</div>
        </div>
      </div>

      <section class="section">
        <h2>Performance Summary</h2>
        <table>
          <thead><tr><th>Metric</th><th class="right">Value</th></tr></thead>
          <tbody>${kpiRows}</tbody>
        </table>
      </section>

      ${aiSection}
      ${insightsSection}

      ${trendTable("Mortality Trend", ["Date", "Birds"], trends.mortality)}
      ${trendTable("Weight Trend", ["Date", "Grams"], trends.weight, " g")}
      ${trendTable("Egg Production", ["Date", "Eggs"], trends.eggs)}
      ${trendTable("Feed Consumption", ["Date", "Kg"], trends.feed, " kg")}

      ${
        financialRows
          ? `<section class="section"><h2>Cost Breakdown</h2><table><thead><tr><th>Category</th><th class="right">Amount</th></tr></thead><tbody>${financialRows}</tbody></table></section>`
          : ""
      }

      <div class="footer">
        LiveStockPro · Flock metrics report for ${escapeHtml(flock.name)}
      </div>
    </div>
  </body>
</html>`
}

function openPrintDocument(html: string, title: string): void {
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  const printAndCleanup = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    window.setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe)
    }, 1000)
  }

  if (iframe.contentWindow?.document.readyState === "complete") {
    printAndCleanup()
  } else {
    iframe.onload = printAndCleanup
  }

  void title
}

export function printFlockMetrics(input: FlockMetricsPrintInput): void {
  const html = buildFlockMetricsPrintHtml(input)
  openPrintDocument(html, `Flock Metrics — ${input.flock.name}`)
}

export function exportFlockMetricsPdf(input: FlockMetricsPrintInput): void {
  const html = buildFlockMetricsPrintHtml(input)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const blobUrl = URL.createObjectURL(blob)

  const printWindow = window.open(blobUrl, "_blank", "noopener,noreferrer,width=1024,height=768")
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl)
    openPrintDocument(html, `Flock Metrics — ${input.flock.name}`)
    return
  }

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
    URL.revokeObjectURL(blobUrl)
  }

  printWindow.onload = triggerPrint
  window.setTimeout(triggerPrint, 500)
}
