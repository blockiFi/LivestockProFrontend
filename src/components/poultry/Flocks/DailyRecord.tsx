import Pagination from "@/components/general/Pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PoultryDailyReport } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { AlertTriangle, Download, Droplets, Eye, Sun, Thermometer } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { Label } from "recharts"

const DailyRecord =({ records }: { records: PoultryDailyReport[] }) => {
    console.log("Daily Records: ", records);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const [dateFilter, setDateFilter] = useState("");

    const filteredRecords = useMemo(() => {
      if (!dateFilter) return records;
      return records.filter((record) => record.date.includes(dateFilter));
    }, [records, dateFilter]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    // Get records for the current page
    const paginatedRecords = useMemo(() => {
      const startIdx = (currentPage - 1) * recordsPerPage;
      return filteredRecords.slice(startIdx, startIdx + recordsPerPage);
    }, [filteredRecords, currentPage, recordsPerPage]);

    const getAlertLevel = (record: PoultryDailyReport) => {
      if (record.mortality > 4) return "high";
      if (record.mortality > 2) return "medium";
      return "normal";
    };
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      console.log("Current Page: ", page);
    };

    // Reset to page 1 if filter changes
    useEffect(() => {
      setCurrentPage(1);
    }, [dateFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label >Filter by Date</Label>
          <Input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mortality</TableHead>
              <TableHead>Feed (kg)</TableHead>
              <TableHead>Water (L)</TableHead>
              <TableHead>Avg Weight (kg)</TableHead>
              <TableHead>Temperature (°C)</TableHead>
              <TableHead>Humidity (%)</TableHead>
              <TableHead>Light Hours</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record, index) => {
              const alertLevel = getAlertLevel(record);
              return (
                <TableRow
                  key={index}
                  className={alertLevel === "high" ? "bg-red-50" : alertLevel === "medium" ? "bg-yellow-50" : ""}
                >
                  <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {alertLevel === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {alertLevel === "medium" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      <span
                        className={
                          alertLevel === "high"
                            ? "text-red-700 font-medium"
                            : alertLevel === "medium"
                              ? "text-yellow-700 font-medium"
                              : ""
                        }
                      >
                        {record.mortality}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{record.feed_consumed_kg.toLocaleString()}</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>{record.avg_weight_grams ? record.avg_weight_grams.toFixed(2) : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-gray-400" />
                      {record.min_temperature}° - {record.max_temperature}°
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-blue-400" />
                      {record.humidity}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Sun className="h-3 w-3 text-yellow-400" />
                      {record.light_hours}h
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.notes && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Eye className="h-4 w-4 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{record.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DailyRecord
