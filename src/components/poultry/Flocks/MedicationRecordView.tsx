import type { PoultryMedicationRecord, Medication, MedicationInventory, AdministrationMethod } from "@/lib/types"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, Eye, Factory, Package2, Pill, Plus, Trash2 } from "lucide-react"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import { formatDate, Naira } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import chicken from "@/assets/chicken.png"
import AddMedicationRecordModal from "@/components/modals/AddMedicationRecordModal"
interface MedicationRecordFormData {
  farm_id: number
  flock_id: number
  poultry_medication_id: number
  poultry_medication_inventory_id: number
  date: string
  administered_by: string
  dosage: number
  dosage_unit: string
  quantity: number
  cost?: number
  notes: string
  administration_method_id: number
}

const MEDICATION_EXPORT_COLUMNS: ExportColumn<PoultryMedicationRecord>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Medication", value: (row) => row.medication?.name ?? "" },
  { header: "Dosage", value: (row) => `${row.dosage || 0} ${row.dosage_unit || ""}`.trim() },
  { header: "Quantity", value: (row) => Number(row.quantity) || 0 },
  { header: "Cost", value: (row) => Number(row.cost) || 0 },
  { header: "Administered By", value: (row) => row.administered_by },
  { header: "Method", value: (row) => row.administration_method?.name ?? "" },
  { header: "Manufacturer", value: (row) => row.medication_inventory?.manufacturer ?? "" },
  { header: "Batch", value: (row) => row.medication_inventory?.batch_number ?? "" },
  { header: "Status", value: (row) => row.medication_inventory?.status ?? "" },
  { header: "Notes", value: (row) => row.notes },
]

interface MedicationRecordViewProps {
  records: PoultryMedicationRecord[]
  flockId: number
  farmId: number
  flockName?: string
  medications?: Medication[]
  medicationInventories?: MedicationInventory[]
  administrationMethods?: AdministrationMethod[]
  onAddMedicationRecord?: (recordData: MedicationRecordFormData) => Promise<void>
  onDeleteMedicationRecord?: (recordId: number) => Promise<void>
}

const MedicationRecordView = ({ 
  records, 
  flockId, 
  farmId,
  flockName, 
  medications = [], 
  medicationInventories = [], 
  administrationMethods = [],
  onAddMedicationRecord,
  onDeleteMedicationRecord
}: MedicationRecordViewProps) => {
  const [dateFilter, setDateFilter] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<PoultryMedicationRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;


  const filteredRecords = useMemo(() => {
    if (!dateFilter) return records
    return records.filter((record) => record.date.includes(dateFilter))
  }, [records, dateFilter])

  // Paginate filtered records
  const paginatedRecords = filteredRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalMedications = records.length
  const totalCost = records.reduce((sum, record) => sum + (Number(record.cost) || 0), 0)
  const uniqueMedications = new Set(records.map((r) => r.medication?.name).filter(Boolean)).size

  const handleAddMedicationRecord = async (recordData: MedicationRecordFormData) => {
    if (onAddMedicationRecord) {
      await onAddMedicationRecord(recordData)
      setIsAddModalOpen(false)
    }
  }

  const handleDeleteClick = (record: PoultryMedicationRecord) => {
    setRecordToDelete(record)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !onDeleteMedicationRecord) return

    setIsDeleting(true)
    try {
      await onDeleteMedicationRecord(recordToDelete.id)
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error("Error deleting medication record:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  const medicationStatusColors: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'low_stock': 'bg-yellow-100 text-yellow-800',
    'out_of_stock': 'bg-red-100 text-red-800',
    'expired': 'bg-gray-100 text-gray-800',
    'pending': 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Administrations</p>
              <p className="text-2xl font-bold text-blue-600">{totalMedications}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="h-5 w-5 text-green-600" >{Naira}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-green-600">{Naira}{(totalCost || 0).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Medications</p>
              <p className="text-2xl font-bold text-purple-600">{uniqueMedications}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="medication-date-filter">Filter by Date</Label>
          <Input
            id="medication-date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2">
          {onAddMedicationRecord && (
            <Button 
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
          <ExportDataButton
            rows={filteredRecords}
            columns={MEDICATION_EXPORT_COLUMNS}
            filename={buildExportFilename(flockName || "flock", "medication")}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Administered By</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              {onDeleteMedicationRecord && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => {
              const isExpiringSoon =
                record.medication_inventory?.expiry_date && 
                new Date(record.medication_inventory.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.medication?.name || 'Unknown Medication'}</p>
                      <p className="text-xs text-gray-500">{record.medication?.description || ''}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${
                          record.medication?.type === "vaccine" ? "border-blue-200 text-blue-700" : "border-gray-200"
                        }`}
                      >
                        {record.medication?.type || 'medication'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {record.dosage || 0} {record.dosage_unit || ''}
                    </span>
                  </TableCell>
                  <TableCell>{(Number(record.quantity) || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">{Naira}{(Number(record.cost) || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={chicken} className="h-4 w-4 text-gray-400" />
                      {record.administered_by}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.administration_method?.name || 'Unknown Method'}</p>
                      <p className="text-xs text-gray-500">{record.administration_method?.description || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-gray-400" />
                      {record.medication_inventory?.manufacturer || 'Unknown Manufacturer'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{record.medication_inventory?.batch_number || 'No Batch'}</span>
                      </div>
                      <div
                        className={`text-xs mt-1 ${isExpiringSoon ? "text-orange-600 font-medium" : "text-gray-500"}`}
                      >
                        Exp: {record.medication_inventory?.expiry_date ? formatDate(record.medication_inventory.expiry_date) : 'No Date'}
                        {isExpiringSoon && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>Expiring Soon</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${medicationStatusColors[record.medication_inventory?.status || 'pending'] || 'bg-gray-100 text-gray-800'} font-medium text-xs`}
                    >
                      {record.medication_inventory?.status?.replace("_", " ").toUpperCase() || 'PENDING'}
                    </Badge>
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
                  {onDeleteMedicationRecord && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(record)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page} of {Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(Math.ceil(filteredRecords.length / rowsPerPage), p + 1))}
          disabled={page === Math.ceil(filteredRecords.length / rowsPerPage) || filteredRecords.length === 0}
        >
          Next
        </Button>
      </div>

      {/* Medication Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Usage Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(records.map((r) => r.medication?.name).filter(Boolean))).map((medicationName) => {
              const medRecords = records.filter((r) => r.medication?.name === medicationName)
              const medQuantity = medRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
              const medCost = medRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
              const medication = medRecords[0]?.medication
              const lastAdministered = medRecords.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )[0]

              if (!medication) return null

              return (
                <Card key={medicationName} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">{medicationName}</h4>
                    </div>
                    <p className="text-xs text-gray-600">{medication.description || ''}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Quantity</p>
                        <p className="font-medium">{(medQuantity || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-medium">{Naira}{(medCost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Administrations</p>
                        <p className="font-medium">{medRecords.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Given</p>
                        <p className="font-medium text-xs">{lastAdministered?.date ? formatDate(lastAdministered.date) : 'No Date'}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        medication.type === "vaccine" ? "border-blue-200 text-blue-700" : "border-gray-200"
                      }`}
                    >
                      {medication.type || 'medication'}
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Medication Record Modal */}
      <AddMedicationRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMedicationRecord}
        flockId={flockId}
        farmId={farmId}
        medications={medications}
        medicationInventories={medicationInventories}
        administrationMethods={administrationMethods}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medication Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medication record? This action cannot be undone.
              {recordToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{recordToDelete.medication?.name || 'Unknown Medication'}</p>
                  <p className="text-sm text-gray-600">
                    Date: {formatDate(recordToDelete.date)} | 
                    Dosage: {recordToDelete.dosage || 0} {recordToDelete.dosage_unit || ''} | 
                    Quantity: {Number(recordToDelete.quantity) || 0}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MedicationRecordView
