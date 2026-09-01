import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import type { WeightReport, FlockRecord } from "@/lib/types"
import { Scale, TrendingDown, TrendingUp, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import chicken from "@/assets/chicken.png"
import { formatDate } from "@/lib/utils"
import AddWeightReportModal from "@/components/modals/AddWeightReportModal"
import { toast } from "react-toastify"

const WEIGHT_EXPORT_COLUMNS: ExportColumn<WeightReport>[] = [
  { header: "Date", value: (row) => formatExportDate(row.report_date) },
  { header: "Average Weight (kg)", value: (row) => row.average_weight ?? "" },
  { header: "Min Weight (kg)", value: (row) => row.min_weight ?? "" },
  { header: "Max Weight (kg)", value: (row) => row.max_weight ?? "" },
  { header: "Sample Size", value: (row) => row.sample_size },
  { header: "Number of Birds", value: (row) => row.number_of_birds },
  { header: "Recorded By", value: (row) => row.recorded_by_name ?? "" },
]

interface WeightReportPageProps {
  reports: WeightReport[]
  flock?: FlockRecord
  onAddRecord?: (recordData: Omit<WeightReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<void>
  onDeleteRecord?: (recordId: number) => Promise<void>
}

const WeightReportPage = ({ reports, flock, onAddRecord, onDeleteRecord }: WeightReportPageProps) => {
  const [isAddWeightReportModalOpen, setIsAddWeightReportModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null)
  const latestWeight = reports[reports.length - 1]?.average_weight || 0
  const weightGain = reports.length > 1 ? latestWeight - (reports[reports.length - 2]?.average_weight || 0) : 0

  const handleAddRecord = async (recordData: Omit<WeightReport, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    if (!onAddRecord) return
    
    try {
      await onAddRecord(recordData)
      toast.success("Weight report created successfully!")
      // Modal will be closed by the AddWeightReportModal component on successful submission
    } catch (error) {
      console.error("Error creating weight report:", error)
      
      // Display error message using toast
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An error occurred while creating the weight report. Please try again.")
      }
      
      // Re-throw the error so the modal doesn't close on error
      throw error
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    setRecordToDelete(recordId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (onDeleteRecord && recordToDelete) {
      try {
        await onDeleteRecord(recordToDelete)
        toast.success("Weight report deleted successfully!")
        setIsDeleteDialogOpen(false)
        setRecordToDelete(null)
      } catch (error) {
        console.error("Error deleting weight report:", error)
        
        // Display error message using toast
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error("An error occurred while deleting the weight report. Please try again.")
        }
      }
    }
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Add Weight Report Button */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <ExportDataButton
          rows={[...reports].reverse()}
          columns={WEIGHT_EXPORT_COLUMNS}
          filename={buildExportFilename(flock?.name || "flock", "weight")}
        />
        {onAddRecord && (
          <Button 
            onClick={() => setIsAddWeightReportModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add Weight Report
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scale className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Avg Weight</p>
              <p className="text-2xl font-bold text-green-600">{latestWeight ? latestWeight.toFixed(2) : "0.00"} kg</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {weightGain >= 0 ? (
                <TrendingUp className="h-5 w-5 text-blue-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight Gain</p>
              <p className={`text-2xl font-bold ${weightGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                {weightGain >= 0 ? "+" : ""}
                {weightGain != null ? weightGain.toFixed(2) : "0.00"} kg
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <img src={chicken} className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sample Size</p>
              <p className="text-2xl font-bold text-purple-600">{reports[reports.length - 1]?.sample_size || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Average Weight (kg)</TableHead>
              <TableHead>Min Weight (kg)</TableHead>
              <TableHead>Max Weight (kg)</TableHead>
              <TableHead>Sample Size</TableHead>
              <TableHead>Number of Birds</TableHead>
              <TableHead>Recorded By</TableHead>
              {onDeleteRecord && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...reports].reverse().map((report, index) => {
              const reversedReports = [...reports].reverse();
              const previousReport = index < reversedReports.length - 1 ? reversedReports[index + 1] : null;
              const showTrend = previousReport && report.average_weight != null && previousReport.average_weight != null;
              const isIncreasing = showTrend && report.average_weight > previousReport.average_weight;
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{formatDate(report.report_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.average_weight != null ? report.average_weight.toFixed(2) : "N/A"}</span>
                      {showTrend && (
                        <span
                          className={`text-xs ${isIncreasing ? "text-green-600" : "text-red-600"}`}
                        >
                          {isIncreasing ? "↗" : "↘"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{report.min_weight != null ? report.min_weight.toFixed(2) : "N/A"}</TableCell>
                  <TableCell>{report.max_weight != null ? report.max_weight.toFixed(2) : "N/A"}</TableCell>
                  <TableCell>{report.sample_size}</TableCell>
                  <TableCell>{report.number_of_birds.toLocaleString()}</TableCell>
                  <TableCell>{report.recorded_by_name ?? "—"}</TableCell>
                  {onDeleteRecord && (
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
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Weight Report Modal */}
      {onAddRecord && (
        <AddWeightReportModal
          isOpen={isAddWeightReportModalOpen}
          onClose={() => setIsAddWeightReportModalOpen(false)}
          onSubmit={handleAddRecord}
          flock={flock}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {onDeleteRecord && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Weight Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this weight report? This action cannot be undone.
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
      )}
    </div>
  )
}


export default WeightReportPage
