import type { EggReport } from "@/lib/types"
import {  Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"

const EGG_EXPORT_COLUMNS: ExportColumn<EggReport>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Eggs Collected", value: (row) => row.eggs_collected },
  { header: "Avg Egg Weight (g)", value: (row) => row.average_egg_weight },
  { header: "Production %", value: (row) => row.production_percentage },
  { header: "Bird Count", value: (row) => row.bird_count },
  { header: "Recorded By", value: (row) => row.recorded_by },
  { header: "Notes", value: (row) => row.notes },
]

const EggRecordPage = ({ reports, flockName }: { reports: EggReport[]; flockName?: string }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportDataButton
          rows={reports}
          columns={EGG_EXPORT_COLUMNS}
          filename={buildExportFilename(flockName || "flock", "eggs")}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Eggs Collected</TableHead>
              <TableHead>Avg Egg Weight (g)</TableHead>
              <TableHead>Production %</TableHead>
              <TableHead>Bird Count</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{formatDate(report.date)}</TableCell>
                <TableCell>{report.eggs_collected}</TableCell>
                <TableCell>{report.average_egg_weight}</TableCell>
                <TableCell>{report.production_percentage}%</TableCell>
                <TableCell>{report.bird_count.toLocaleString()}</TableCell>
                <TableCell>{report.recorded_by}</TableCell>
                <TableCell>
                  {report.notes && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Eye className="h-4 w-4 text-gray-400 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{report.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default EggRecordPage
