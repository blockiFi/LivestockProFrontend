import type { FlockComparativeReport } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export type FlockComparativePrintInput = {
  report: FlockComparativeReport
  flockName: string
  batchNumber: string
  farmName?: string | null
  generatedAt?: Date
}

const METRIC_LABELS: Record<string, string> = {
  mortality_rate_percent: "Mortality Rate (%)",
  survival_rate_percent: "Survival Rate (%)",
  feed_kg: "Total Feed (kg)",
  feed_per_bird_kg: "Feed per Bird (kg)",
  feed_conversion_ratio: "FCR",
  weight_gain_rate_g_per_day: "Daily Weight Gain (g)",
  latest_weight_g: "Latest Weight (g)",
  egg_production_rate_percent: "Hen-day Production (%)",
  total_eggs: "Total Eggs",
  net_profit: "Net Profit",
  margin_percent: "Margin (%)",
  cost_per_bird: "Cost per Bird",
  days_in_flock: "Days in Flock",
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatMetricValue(key: string, value: number | null): string {
  if (value === null) return "—"
  if (key.includes("percent") || key === "margin_percent") return `${value.toFixed(1)}%`
  if (key === "feed_conversion_ratio") return value.toFixed(2)
  if (key.includes("profit") || key.includes("cost") || key.includes("revenue")) {
    return `₦${formatCurrency(value)}`
  }
  if (key.includes("weight") || key.includes("eggs")) return value.toLocaleString()
  return value.toFixed(2)
}

function listItems(items: string[]): string {
  if (items.length === 0) return "<p class=\"muted\">None listed.</p>"
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

export function buildFlockComparativePrintHtml(input: FlockComparativePrintInput): string {
  const { report, flockName, batchNumber, farmName, generatedAt } = input
  const generatedLabel = (generatedAt ?? new Date()).toLocaleString()
  const naira = "₦"

  const aggregateRows = Object.entries(report.aggregates)
    .map(([key, agg]) => {
      if (agg.avg === null) return ""
      const label = METRIC_LABELS[key] ?? key
      const rankLabel = agg.rank != null && agg.peer_count > 0
        ? `${agg.rank} of ${agg.peer_count + 1}`
        : "—"
      return `<tr>
        <td>${escapeHtml(label)}</td>
        <td class="right bold">${escapeHtml(formatMetricValue(key, agg.target))}</td>
        <td class="right">${escapeHtml(formatMetricValue(key, agg.avg))}</td>
        <td class="right">${escapeHtml(rankLabel)}</td>
        <td class="right">${agg.delta_vs_avg != null ? escapeHtml(formatMetricValue(key, agg.delta_vs_avg)) : "—"}</td>
      </tr>`
    })
    .filter(Boolean)
    .join("")

  const peerRows = [report.target_flock, ...report.peers]
    .map((row) => {
      const isTarget = row.id === report.target_flock.id
      const fcr = row.metrics.feed_conversion_ratio
      return `<tr class="${isTarget ? "highlight" : ""}">
        <td>${escapeHtml(row.name)}${isTarget ? " (this batch)" : ""}</td>
        <td>${escapeHtml(row.batch_number)}</td>
        <td>${escapeHtml(row.status)}</td>
        <td class="right">${row.metrics.mortality_rate_percent.toFixed(1)}%</td>
        <td class="right">${fcr != null ? fcr.toFixed(2) : "—"}</td>
        <td class="right">${naira}${escapeHtml(formatCurrency(row.metrics.net_profit))}</td>
        <td class="right">${row.metrics.margin_percent.toFixed(1)}%</td>
      </tr>`
    })
    .join("")

  const aiSection = report.ai_insights
    ? `
      <section class="section ai-box">
        <h2>AI Comparative Analysis</h2>
        <p>${escapeHtml(report.ai_insights.executive_summary)}</p>
        <p><strong>Peer ranking:</strong> ${escapeHtml(report.ai_insights.peer_ranking_summary)}</p>
        <div class="two-col">
          <div><h3>Strengths</h3>${listItems(report.ai_insights.strengths)}</div>
          <div><h3>Gaps</h3>${listItems(report.ai_insights.gaps)}</div>
        </div>
        ${
          report.ai_insights.recommendations.length > 0
            ? `<h3>Recommendations</h3><ul>${report.ai_insights.recommendations
                .map(
                  (rec) =>
                    `<li><strong>[${escapeHtml(rec.priority)}]</strong> ${escapeHtml(rec.action)} — ${escapeHtml(rec.reason)}</li>`
                )
                .join("")}</ul>`
            : ""
        }
      </section>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Batch Comparison — ${escapeHtml(flockName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 13px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 14px; margin: 12px 0 6px; }
    .meta { color: #64748b; margin-bottom: 20px; }
    .section { margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    .right { text-align: right; }
    .bold { font-weight: 600; }
    .highlight { background: #eff6ff; }
    .muted { color: #64748b; }
    .ai-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .footer { margin-top: 32px; color: #94a3b8; font-size: 11px; text-align: center; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>Batch Comparative Report</h1>
  <p class="meta">
    ${farmName ? `${escapeHtml(farmName)} · ` : ""}${escapeHtml(flockName)} (Batch ${escapeHtml(batchNumber)})
    · ${escapeHtml(report.poultry_type)} · ${report.peer_count} completed peer batch${report.peer_count === 1 ? "" : "es"}
    · Generated ${escapeHtml(generatedLabel)}${report.cached ? " (cached)" : ""}
  </p>

  <section class="section">
    <h2>Your Batch vs Peer Average</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th class="right">This Batch</th>
          <th class="right">Peer Avg</th>
          <th class="right">Rank</th>
          <th class="right">Delta vs Avg</th>
        </tr>
      </thead>
      <tbody>${aggregateRows || '<tr><td colspan="5" class="muted">No comparative metrics available.</td></tr>'}</tbody>
    </table>
  </section>

  <section class="section">
    <h2>Highlights</h2>
    <div class="two-col">
      <div><h3>Strengths</h3>${listItems(report.highlights.strengths)}</div>
      <div><h3>Gaps</h3>${listItems(report.highlights.gaps)}</div>
    </div>
  </section>

  <section class="section">
    <h2>All Batches</h2>
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Number</th>
          <th>Status</th>
          <th class="right">Mortality</th>
          <th class="right">FCR</th>
          <th class="right">Net Profit</th>
          <th class="right">Margin</th>
        </tr>
      </thead>
      <tbody>${peerRows}</tbody>
    </table>
  </section>

  ${aiSection}

  <div class="footer">Farm Central · Comparative batch report for ${escapeHtml(flockName)}</div>
</body>
</html>`
}

function openPrintDocument(html: string): void {
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
}

export function printFlockComparativeReport(input: FlockComparativePrintInput): void {
  openPrintDocument(buildFlockComparativePrintHtml(input))
}

export function exportFlockComparativePdf(input: FlockComparativePrintInput): void {
  const html = buildFlockComparativePrintHtml(input)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const blobUrl = URL.createObjectURL(blob)
  const printWindow = window.open(blobUrl, "_blank", "noopener,noreferrer,width=1024,height=768")

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl)
    openPrintDocument(html)
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
