import * as XLSX from "xlsx"

export type ExportFormat = "csv" | "xlsx"

export type ExportColumn<T> = {
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

export type ExportTableOptions<T> = {
  rows: T[]
  columns: ExportColumn<T>[]
  filename: string
  format: ExportFormat
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const text = value == null ? "" : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function toCellValue(value: string | number | boolean | null | undefined): string | number | boolean {
  if (value == null) return ""
  return value
}

export function formatExportDate(value: string | null | undefined): string {
  if (!value) return ""
  return value.includes("T") ? value.split("T")[0] : value
}

export function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase() || "export"
}

export function buildExportFilename(prefix: string, label?: string): string {
  const date = new Date().toISOString().split("T")[0]
  const parts = [sanitizeFilename(prefix)]
  if (label) parts.push(sanitizeFilename(label))
  parts.push(date)
  return parts.join("-")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function buildMatrix<T>(rows: T[], columns: ExportColumn<T>[]): (string | number | boolean)[][] {
  const header = columns.map((column) => column.header)
  const body = rows.map((row) => columns.map((column) => toCellValue(column.value(row))))
  return [header, ...body]
}

function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const csv = buildMatrix(rows, columns)
    .map((cols) => cols.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `${filename}.csv`)
}

function exportXlsx<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const worksheet = XLSX.utils.aoa_to_sheet(buildMatrix(rows, columns))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export")
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  downloadBlob(blob, `${filename}.xlsx`)
}

export function exportTableData<T>({ rows, columns, filename, format }: ExportTableOptions<T>): void {
  const safeName = sanitizeFilename(filename)
  if (format === "xlsx") {
    exportXlsx(rows, columns, safeName)
    return
  }
  exportCsv(rows, columns, safeName)
}
