import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MortalityReport, FlockRecord } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Activity, AlertTriangle, Eye, Heart, TrendingUp, Plus, Trash2 } from "lucide-react"
import Pagination from "@/components/general/Pagination"
import { useState, useMemo, useEffect } from "react"
import AddMortalityRecordModal from "@/components/modals/AddMortalityRecordModal"

const MortalityReportPage = ({ reports, flock, onAddRecord, onDeleteRecord }: { 
  reports: MortalityReport[], 
  flock?: FlockRecord,
  onAddRecord?: (record: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onDeleteRecord?: (recordId: number) => Promise<void>
}) =>  {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const reportsPerPage = 10;
  const totalReports = reports.length;
  const totalPages = Math.ceil(totalReports / reportsPerPage);

  // Get reports for the current page
  const paginatedReports = useMemo(() => {
    const startIdx = (currentPage - 1) * reportsPerPage;
    return reports.slice(startIdx, startIdx + reportsPerPage);
  }, [reports, currentPage, reportsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports]);

  const totalMortality = reports.reduce((sum, report) => sum + report.mortality_count, 0)
  const avgMortalityRate = reports.reduce((sum, report) => sum + report.mortality_percentage, 0) / reports.length

  const handleAddRecord = async (recordData: Omit<MortalityReport, 'id' | 'created_at' | 'updated_at'>) => {
    if (onAddRecord) {
      await onAddRecord(recordData);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    setRecordToDelete(recordId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (onDeleteRecord && recordToDelete) {
      await onDeleteRecord(recordToDelete);
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mortality Reports</h2>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
           className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Mortality Record
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mortality</p>
              <p className="text-2xl font-bold text-red-600">{totalMortality}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Mortality Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {isNaN(avgMortalityRate) ? "0.00" : avgMortalityRate.toFixed(2)} / day
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Bird Count</p>
              <p className="text-2xl font-bold text-blue-600">
                {flock?.actual_quantity ? flock.actual_quantity.toLocaleString() : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mortality Count</TableHead>
              <TableHead>Mortality %</TableHead>
              <TableHead>Bird Count</TableHead>
              <TableHead>Avg Weight (kg)</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReports.map((report, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{formatDate(report.date)}</TableCell>
                <TableCell>
                  <span
                    className={
                      report.mortality_count > 4
                        ? "text-red-600 font-medium"
                        : report.mortality_count > 2
                          ? "text-yellow-600 font-medium"
                          : ""
                    }
                  >
                    {report.mortality_count}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        report.mortality_percentage > 0.4
                          ? "text-red-600 font-medium"
                          : report.mortality_percentage > 0.2
                            ? "text-yellow-600 font-medium"
                            : ""
                      }
                    >
                      {report.mortality_percentage.toFixed(2)}%
                    </span>
                    {report.mortality_percentage > 0.4 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </TableCell>
                <TableCell>{report.bird_count.toLocaleString()}</TableCell>
                <TableCell>{report.average_weight?.toFixed(2) || "N/A"}</TableCell>
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
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRecord(report.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Add Mortality Record Modal */}
      <AddMortalityRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRecord}
        flock={flock}
        mortalityReports={reports}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Mortality Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mortality record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MortalityReportPage
