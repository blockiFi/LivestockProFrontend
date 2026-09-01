import type {  PoultryFeedUsageRecord, FlockRecord, FeedInventoryType, FeedType } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMemo, useState } from "react"
import { AlertTriangle, DollarSign, Factory, Package2, TrendingUp, Wheat, Plus, Trash2 } from "lucide-react"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate, getExpiryStatus } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import AddFeedUsageModal from "@/components/modals/AddFeedUsageModal"
import { toast } from "react-toastify"
const FEED_EXPORT_COLUMNS: ExportColumn<PoultryFeedUsageRecord>[] = [
  { header: "Usage Date", value: (row) => formatExportDate(row.usage_date) },
  { header: "Feed Type", value: (row) => row.feed_type?.name ?? "" },
  { header: "Quantity (kg)", value: (row) => row.quantity ?? 0 },
  { header: "Unit Cost", value: (row) => row.unit_cost ?? 0 },
  { header: "Total Cost", value: (row) => (Number(row.quantity) || 0) * (Number(row.unit_cost) || 0) },
  { header: "Manufacturer", value: (row) => row.feed_inventory?.manufacturer ?? "" },
  { header: "Batch Number", value: (row) => row.feed_inventory?.batch_number ?? "" },
  { header: "Inventory Status", value: (row) => row.feed_inventory?.status ?? "" },
  { header: "Expiry Date", value: (row) => formatExportDate(row.feed_inventory?.expiry_date) },
]

const feedStatusColors = {
  available: "bg-green-100 text-green-800",
  low_stock: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  out_of_stock: "bg-gray-100 text-gray-800",
}
const FeedUsageView  = ({ 
  records, 
  flock, 
  onAddRecord,
  onDeleteRecord,
  feedInventories = [],
  feedTypes = []
}: { 
  records: PoultryFeedUsageRecord[]
  flock?: FlockRecord
  onAddRecord?: (recordData: Omit<PoultryFeedUsageRecord, 'id' | 'created_at' | 'updated_at' | 'feed_inventory' | 'feed_type' | 'flock'>) => Promise<void>
  onDeleteRecord?: (recordId: number) => Promise<void>
  feedInventories?: FeedInventoryType[]
  feedTypes?: FeedType[]
}) => {
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1);
  const [openSummary, setOpenSummary] = useState(true)
  const [isAddFeedUsageModalOpen, setIsAddFeedUsageModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<PoultryFeedUsageRecord | null>(null)
  const recordsPerPage = 10

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(records)) return []
    if (!dateFilter) return records
    return records.filter((record) => record?.usage_date && record.usage_date.includes(dateFilter))
  }, [records, dateFilter])

  const totalFeedUsed = Array.isArray(records) ? records.reduce((sum, record) => {
    const quantity = record?.quantity || 0;
    return sum + (typeof quantity === 'number' ? quantity : 0);
  }, 0) : 0
  
  const totalCost = Array.isArray(records) ? records.reduce((sum, record) => {
    const quantity = record?.quantity || 0;
    const unitCost = record?.unit_cost || 0;
    return sum + (typeof quantity === 'number' && typeof unitCost === 'number' ? quantity * unitCost : 0);
  }, 0) : 0
  
  const avgCostPerKg = totalFeedUsed > 0 ? totalCost / totalFeedUsed : 0

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const reversedFilteredRecords = [...filteredRecords].reverse()
  const paginatedRecords = reversedFilteredRecords.slice((page - 1) * recordsPerPage, page * recordsPerPage)

  const handleAddRecord = async (recordData: Omit<PoultryFeedUsageRecord, 'id' | 'created_at' | 'updated_at' | 'feed_inventory' | 'feed_type' | 'flock'>) => {
    if (!onAddRecord) return
    
    try {
      await onAddRecord(recordData)
      toast.success("Feed usage record created successfully!")
      // Modal will be closed by the AddFeedUsageModal component on successful submission
    } catch (error) {
      console.error("Error creating feed usage record:", error)
      
      // Display error message using toast
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An error occurred while creating the feed usage record. Please try again.")
      }
      
      // Re-throw the error so the modal doesn't close on error
      throw error
    }
  }

  const handleDeleteClick = (record: PoultryFeedUsageRecord) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !onDeleteRecord) return

    try {
      await onDeleteRecord(recordToDelete.id)
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
      toast.success("Feed usage record deleted successfully!")
    } catch (error) {
      console.error("Error deleting feed usage record:", error)
      toast.error("An error occurred while deleting the feed usage record. Please try again.")
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  // Reset to first page when filter changes
  useMemo(() => { setPage(1) }, [dateFilter])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wheat className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Feed Used</p>
              <p className="text-2xl font-bold text-green-600">{(totalFeedUsed != null && typeof totalFeedUsed === 'number') ? totalFeedUsed.toFixed(2) : "0.00"} kg</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-blue-600"> ₦{(totalCost != null && typeof totalCost === 'number') ? totalCost.toFixed(2) : "0.00"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Cost per kg</p>
              <p className="text-2xl font-bold text-purple-600"> ₦{(avgCostPerKg != null && typeof avgCostPerKg === 'number') ? avgCostPerKg.toFixed(2) : "0.00"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Feed Usage Button */}
      {onAddRecord && (
        <div className="flex items-center justify-end mb-4">
          <Button 
            onClick={() => setIsAddFeedUsageModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add Feed Usage Record
          </Button>
        </div>
      )}

 {/* Feed Type Summary */}
    {
      openSummary &&
     <Card >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2 justify-between w-full">
              <span>
                <Wheat className="h-5 w-5" />
                Feed Type Usage Summary
            </span>
              <Button variant="ghost" size="icon" onClick={() => setOpenSummary(false)}>
                <span className="h-4 w-4" >X </span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.isArray(records) ? Array.from(new Set(records.filter((r) => r.feed_type?.name).map((r) => r.feed_type!.name))).map((feedTypeName) => {
              const typeRecords = records.filter((r) => r.feed_type?.name === feedTypeName)
              const typeQuantity = typeRecords.reduce((sum, r) => {
                const quantity = r?.quantity || 0;
                return sum + (typeof quantity === 'number' ? quantity : 0);
              }, 0)
              const typeCost = typeRecords.reduce((sum, r) => {
                const quantity = r?.quantity || 0;
                const unitCost = r?.unit_cost || 0;
                return sum + (typeof quantity === 'number' && typeof unitCost === 'number' ? quantity * unitCost : 0);
              }, 0)
              const feedType = typeRecords[0]?.feed_type

              return (
                <Card key={feedTypeName} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold">{feedTypeName}</h4>
                    </div>
                    <p className="text-xs text-gray-600">{feedType?.description || "No description available"}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Quantity Used</p>
                        <p className="font-medium">{(typeQuantity != null && typeof typeQuantity === 'number') ? typeQuantity.toFixed(2) : "0.00"} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-medium"> ₦{(typeCost != null && typeof typeCost === 'number') ? typeCost.toFixed(2) : "0.00"}</p>
                      </div>
                    </div>
                    {feedType?.start_age && feedType?.end_age && (
                      <div className="text-xs text-gray-500">
                        Recommended Age: {feedType.start_age}-{feedType.end_age} days
                      </div>
                    )}
                  </div>
                </Card>
              )
            }) : <div className="text-center text-gray-500 p-4">No feed usage data available</div>}
          </div>
        </CardContent>
      </Card>

       }
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="feed-date-filter">Filter by Date</Label>
          <Input
            id="feed-date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <ExportDataButton
          rows={filteredRecords}
          columns={FEED_EXPORT_COLUMNS}
          filename={buildExportFilename(flock?.name || "flock", "feed-usage")}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usage Date</TableHead>
              <TableHead>Feed Type</TableHead>
              <TableHead>Quantity (kg)</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Inventory Status</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(paginatedRecords) && paginatedRecords.length > 0 ? paginatedRecords.map((record) => {
              // Ensure we have proper numeric values with additional safety
              const quantity = record?.quantity != null ? (typeof record.quantity === 'string' ? parseFloat(record.quantity) : record.quantity) : 0;
              const unitCost = record?.unit_cost != null ? (typeof record.unit_cost === 'string' ? parseFloat(record.unit_cost) : record.unit_cost) : 0;
              const totalRecordCost = (typeof quantity === 'number' && typeof unitCost === 'number' && !isNaN(quantity) && !isNaN(unitCost)) ? quantity * unitCost : 0;
              const expiryStatus = getExpiryStatus(record.feed_inventory?.expiry_date)
              const isExpired = expiryStatus === "expired"
              const isExpiringSoon = expiryStatus === "expiring_soon"

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.usage_date ? formatDate(record.usage_date) : "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.feed_type?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">{record.feed_type?.description || "No description"}</p>
                      {record.feed_type?.start_age && record.feed_type?.end_age && (
                        <p className="text-xs text-gray-500">
                          Age: {record.feed_type.start_age}-{record.feed_type.end_age} days
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{(quantity != null && typeof quantity === 'number' && !isNaN(quantity)) ? quantity.toFixed(2) : "N/A"}</TableCell>
                  <TableCell> ₦{(unitCost != null && typeof unitCost === 'number' && !isNaN(unitCost)) ? unitCost.toFixed(2) : "N/A"}</TableCell>
                  <TableCell className="font-medium"> ₦{(totalRecordCost != null && typeof totalRecordCost === 'number' && !isNaN(totalRecordCost)) ? totalRecordCost.toFixed(2) : "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-gray-400" />
                      {record.feed_inventory?.manufacturer || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-sm">{record.feed_inventory?.batch_number || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${feedStatusColors[record.feed_inventory?.status as keyof typeof feedStatusColors] || ""} font-medium text-xs`}>
                      {record.feed_inventory?.status ? record.feed_inventory.status.replace("_", " ").toUpperCase() : "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-orange-600 font-medium" : ""}>
                      {record.feed_inventory?.expiry_date ? formatDate(record.feed_inventory.expiry_date) : "N/A"}
                      {isExpired && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs">Expired</span>
                        </div>
                      )}
                      {isExpiringSoon && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          <span className="text-xs">Expiring Soon</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDeleteClick(record)}
                        className="text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                  No feed usage records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </div>

      {/* Add Feed Usage Modal */}
      {onAddRecord && (
        <AddFeedUsageModal
          isOpen={isAddFeedUsageModalOpen}
          onClose={() => setIsAddFeedUsageModalOpen(false)}
          onSubmit={handleAddRecord}
          flock={flock}
          feedInventories={feedInventories}
          feedTypes={feedTypes}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this feed usage record? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FeedUsageView
