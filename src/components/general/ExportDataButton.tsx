import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import {
  exportTableData,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/exportData"

type ExportDataButtonProps<T> = {
  rows?: T[]
  getRows?: () => Promise<T[]>
  columns: ExportColumn<T>[]
  filename: string
  disabled?: boolean
  label?: string
}

export function ExportDataButton<T>({
  rows,
  getRows,
  columns,
  filename,
  disabled = false,
  label = "Export",
}: ExportDataButtonProps<T>) {
  const [busy, setBusy] = useState(false)
  const knownCount = rows?.length ?? null
  const isEmpty = knownCount === 0 && !getRows

  const handleExport = async (format: ExportFormat) => {
    if (disabled || busy) return

    setBusy(true)
    try {
      const data = getRows ? await getRows() : (rows ?? [])
      if (data.length === 0) {
        toast.info("No rows to export")
        return
      }

      exportTableData({ rows: data, columns, filename, format })
      toast.success(`Exported ${data.length} row${data.length === 1 ? "" : "s"}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <ActionGate anyOf={ACTIONS.statistics.export}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || busy || isEmpty}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void handleExport("csv")}>
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void handleExport("xlsx")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ActionGate>
  )
}
