import type { EggReport } from "@/lib/types"
import {  Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"
const EggRecordPage = ({ reports }: { reports: EggReport[] }) => {
  return (
    <div className="space-y-6">
   

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
