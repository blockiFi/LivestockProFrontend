import type { BatchActivityReportMeta, BatchActivityRow } from "@/lib/request"
import { SUMMARY_LABELS } from "@/lib/batchActivityExport"
import { buildBatchBadgeLabel } from "@/lib/dateRange"
import type { DetailedFlockRecord } from "@/lib/types"

export type FlockActivitiesPrintInput = {
  flock: DetailedFlockRecord
  report: BatchActivityReportMeta
  rows: BatchActivityRow[]
  farmName?: string | null
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

export function buildFlockActivitiesPrintHtml(input: FlockActivitiesPrintInput): string {
  const { flock, report, rows, farmName, generatedAt } = input
  const generatedLabel = (generatedAt ?? new Date()).toLocaleString()
  const badge = buildBatchBadgeLabel(
    {
      batch_number: report.batch.batch_number ?? flock.batch_number,
      name: report.batch.name ?? flock.name,
      poultry_type: { name: report.batch.poultry_type ?? flock.poultry_type?.name ?? "Flock" },
    },
    report.date_range.from,
    report.date_range.to,
    report.batch.batch_week
  )

  const summaryRows = Object.entries(report.summary)
    .filter(([key, value]) => key !== "total_activities" && value != null && value !== 0)
    .map(
      ([key, value]) =>
        `<tr><td>${escapeHtml(SUMMARY_LABELS[key] ?? key)}</td><td class="right">${escapeHtml(String(value))}</td></tr>`
    )
    .join("")

  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.activity)}</td>
        <td>${escapeHtml(row.category.replace(/_/g, " "))}</td>
        <td>${escapeHtml(row.description)}</td>
        <td class="right">${row.quantity != null ? escapeHtml(String(row.quantity)) : ""}</td>
        <td>${escapeHtml(row.unit ?? "")}</td>
        <td>${escapeHtml(row.performed_by ?? "")}</td>
        <td>${escapeHtml(row.status)}</td>
      </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Batch Activity Report</title>
    <style>
      body { font-family: system-ui, sans-serif; color: #111; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .muted { color: #555; font-size: 12px; }
      .badge { display: inline-block; margin: 12px 0 20px; padding: 8px 12px; border-radius: 8px; background: #f1f5f9; font-size: 13px; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; }
      .right { text-align: right; }
      .section { margin-bottom: 24px; }
      .footer { margin-top: 32px; font-size: 11px; color: #64748b; }
    </style>
  </head>
  <body>
    <h1>Batch Activity Report</h1>
    <p class="muted">${escapeHtml(farmName ?? report.farm_name ?? "Farm")} · Generated ${escapeHtml(generatedLabel)}</p>
    <div class="badge">${escapeHtml(badge)}</div>

    <section class="section">
      <h2>Summary</h2>
      <table>
        <tbody>
          <tr><td>Total activities</td><td class="right">${escapeHtml(String(report.summary.total_activities ?? 0))}</td></tr>
          ${summaryRows}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Activities</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Activity</th><th>Category</th><th>Description</th>
            <th>Quantity</th><th>Unit</th><th>Performed By</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${tableRows || '<tr><td colspan="8">No activities</td></tr>'}</tbody>
      </table>
    </section>

    <div class="footer">LiveStock Pro · Batch activity report for ${escapeHtml(flock.name)}</div>
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

export function exportFlockActivitiesPdf(input: FlockActivitiesPrintInput): void {
  const html = buildFlockActivitiesPrintHtml(input)
  openPrintDocument(html)
}
