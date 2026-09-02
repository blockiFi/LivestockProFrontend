import { formatCurrency } from "@/lib/currency"
import { getInvoiceSenderDetails } from "@/lib/invoiceSender"
import type { Farm, FarmSettings, Invoice } from "@/lib/types"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString()
}

function statusStyles(status: Invoice["status"]): string {
  switch (status) {
    case "Paid":
      return "background:#dcfce7;color:#166534;"
    case "Pending":
      return "background:#fef9c3;color:#854d0e;"
    default:
      return "background:#fee2e2;color:#991b1b;"
  }
}

export function buildInvoicePrintHtml(invoice: Invoice, farm: Farm | null, farmSettings?: FarmSettings | null): string {
  const sender = getInvoiceSenderDetails(farm)

  const senderLines = [
    sender.email ? `Email: ${sender.email}` : null,
    sender.phone ? `Phone: ${sender.phone}` : null,
    sender.website ? sender.website : null,
  ]
    .filter(Boolean)
    .map((line) => `<p class="muted">${escapeHtml(line!)}</p>`)
    .join("")

  const rows = invoice.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${formatCurrency(item.unitPrice, { farmSettings, farm })}</td>
          <td class="right bold">${formatCurrency(item.total, { farmSettings, farm })}</td>
        </tr>`
    )
    .join("")

  const notes = invoice.notes
    ? `
      <div class="notes">
        <p class="label">Notes</p>
        <p class="muted">${escapeHtml(invoice.notes)}</p>
      </div>`
    : ""

  const paymentInstructions = invoice.paymentInstructions
    ? `
      <div class="notes payment-instructions">
        <p class="label">Payment Instructions</p>
        <p class="muted pre-line">${escapeHtml(invoice.paymentInstructions)}</p>
      </div>`
    : ""

  const taxRow =
    invoice.taxEnabled !== false
      ? `
            <div class="totals-row">
              <span>Tax (${invoice.taxRate ?? 10}%)</span>
              <span class="bold">${formatCurrency(invoice.tax, { farmSettings, farm })}</span>
            </div>`
      : ""

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(invoice.invoiceNumber)}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #111827;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .invoice-page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 18mm 20mm;
        display: flex;
        flex-direction: column;
      }

      .invoice-body {
        flex: 1 1 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
      }

      .title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #2563eb;
      }

      .farm-name {
        margin: 12px 0 0;
        font-size: 16px;
        font-weight: 600;
      }

      .muted {
        margin: 4px 0 0;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
      }

      .meta {
        text-align: right;
        font-size: 13px;
      }

      .meta .number {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px;
      }

      .status {
        display: inline-block;
        margin-top: 10px;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
      }

      .parties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      .label {
        margin: 0 0 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .party-name {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }

      .right-col {
        text-align: right;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 32px;
        font-size: 13px;
      }

      thead tr {
        border-bottom: 2px solid #2563eb;
      }

      th {
        padding: 10px 0;
        text-align: left;
        font-weight: 600;
      }

      th.center,
      td.center {
        text-align: center;
      }

      th.right,
      td.right {
        text-align: right;
      }

      tbody tr {
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 14px 0;
        vertical-align: top;
      }

      .bold {
        font-weight: 600;
      }

      .totals-wrap {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 24px;
      }

      .totals {
        width: 260px;
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
      }

      .totals-grand {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        padding: 14px 16px;
        background: #eff6ff;
        border-radius: 6px;
        font-size: 14px;
      }

      .totals-grand .amount {
        font-size: 20px;
        font-weight: 700;
        color: #2563eb;
      }

      .notes {
        border-top: 1px solid #e5e7eb;
        padding-top: 20px;
        font-size: 13px;
      }

      .payment-instructions {
        margin-top: 16px;
      }

      .pre-line {
        white-space: pre-line;
      }

      .footer {
        margin-top: auto;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #6b7280;
      }

      .footer p {
        margin: 0;
      }

      .footer p + p {
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <div class="invoice-page">
      <div class="invoice-body">
        <div class="header">
          <div>
            <h1 class="title">INVOICE</h1>
            <p class="farm-name">${escapeHtml(sender.name)}</p>
            ${sender.address ? `<p class="muted">${escapeHtml(sender.address)}</p>` : ""}
          </div>
          <div class="meta">
            <p class="number">${escapeHtml(invoice.invoiceNumber)}</p>
            <p class="muted">Date: ${formatDate(invoice.date)}</p>
            <p class="muted">Due: ${formatDate(invoice.dueDate)}</p>
            <span class="status" style="${statusStyles(invoice.status)}">${invoice.status}</span>
          </div>
        </div>

        <div class="parties">
          <div>
            <p class="label">Bill To</p>
            <p class="party-name">${escapeHtml(invoice.clientName)}</p>
            <p class="muted">${escapeHtml(invoice.clientEmail)}</p>
          </div>
          <div class="right-col">
            <p class="label">From</p>
            <p class="party-name">${escapeHtml(sender.name)}</p>
            ${sender.address ? `<p class="muted">${escapeHtml(sender.address)}</p>` : ""}
            ${senderLines}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="center">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals-wrap">
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span class="bold">${formatCurrency(invoice.subtotal, { farmSettings, farm })}</span>
            </div>
            ${taxRow}
            <div class="totals-grand">
              <span class="bold">Total</span>
              <span class="amount">${formatCurrency(invoice.total, { farmSettings, farm })}</span>
            </div>
          </div>
        </div>

        ${notes}
        ${paymentInstructions}
      </div>

      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Please retain this invoice for your records.</p>
      </div>
    </div>
  </body>
</html>`
}

export function printInvoice(invoice: Invoice, farm: Farm | null, farmSettings?: FarmSettings | null): void {
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  iframe.style.visibility = "hidden"

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(buildInvoicePrintHtml(invoice, farm, farmSettings))
  doc.close()

  const printAndCleanup = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    window.setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }, 1000)
  }

  if (iframe.contentWindow?.document.readyState === "complete") {
    printAndCleanup()
  } else {
    iframe.onload = printAndCleanup
  }
}
