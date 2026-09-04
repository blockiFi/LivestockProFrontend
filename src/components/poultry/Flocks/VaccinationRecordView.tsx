import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PoultryVaccinationRecord, vaccine, PoultryVaccineInventory, AdministrationMethod, BatchSchedule, ScheduleItem } from "@/lib/types";
import { formatDate, Naira, formatCurrency } from "@/lib/utils";
import { isDateInRange } from "@/lib/dateRange";
import { Activity, AlertTriangle, Calendar, Eye, Factory, Loader2, Package2, RefreshCw, Shield, User, Users, Plus, Edit, Trash2 } from "lucide-react";
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AddVaccinationRecordModal, { type VaccinationRecordFormData } from "@/components/modals/AddVaccinationRecordModal"
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog"
import RecordsDateRangeFilter from "@/components/poultry/Flocks/RecordsDateRangeFilter"
import { useRecordsDateRange } from "@/hooks/useRecordsDateRange"
import { getFlockNotifications } from "@/lib/request"
import { mapUpcomingVaccinations, urgencyLabel, type UpcomingVaccinationItem } from "@/lib/upcomingVaccinations"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import ImplementScheduleModal from "@/components/poultry/Flocks/batchSchedule/ImplementScheduleModal"
import { toast } from "react-toastify"

const VACCINATION_EXPORT_COLUMNS: ExportColumn<PoultryVaccinationRecord>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Vaccine", value: (row) => row.vaccine?.name ?? "" },
  { header: "Dosage", value: (row) => `${row.dosage || 0} ${row.dosage_unit || ""}`.trim() },
  { header: "Quantity", value: (row) => Number(row.quantity) || 0 },
  { header: "Cost", value: (row) => Number(row.cost) || 0 },
  { header: "Administered By", value: (row) => row.administered_by },
  { header: "Method", value: (row) => row.administration_method?.name ?? "" },
  { header: "Manufacturer", value: (row) => row.vaccine_inventory?.manufacturer ?? "" },
  { header: "Batch", value: (row) => row.vaccine_inventory?.batch_number ?? "" },
  { header: "Status", value: (row) => row.vaccine_inventory?.status ?? "" },
  { header: "Notes", value: (row) => row.notes },
]

interface VaccinationRecordViewProps {
  records: PoultryVaccinationRecord[]
  flockId: number
  farmId: number
  flockName?: string
  vaccines?: vaccine[]
  vaccineInventories?: PoultryVaccineInventory[]
  administrationMethods?: AdministrationMethod[]
  vaccinationSchedules?: BatchSchedule[]
  currentAge?: number
  onOpenSchedule?: () => void
  onRefresh?: () => Promise<void>
  onAddVaccinationRecord?: (recordData: VaccinationRecordFormData) => Promise<void>
  onDeleteVaccinationRecord?: (recordId: number) => Promise<void>
}

const vaccineStatusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  expired: "bg-red-100 text-red-800 border-red-200",
  used: "bg-gray-100 text-gray-700 border-gray-200",
  // Add more statuses as needed
  }

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
}
const VaccinationRecordView = ({ 
  records, 
  flockId, 
  farmId,
  flockName, 
  vaccines = [], 
  vaccineInventories = [], 
  administrationMethods = [],
  vaccinationSchedules = [],
  currentAge = 0,
  onOpenSchedule,
  onRefresh,
  onAddVaccinationRecord,
  onDeleteVaccinationRecord
}: VaccinationRecordViewProps) => {
  const token = useSelector((state: RootState) => state.authentication.token)
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
    rangeLabel,
  } = useRecordsDateRange()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<PoultryVaccinationRecord | null>(null)
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<UpcomingVaccinationItem[]>([])
  const [reminderWindowDays, setReminderWindowDays] = useState(7)
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null)
  const [selectedBatchScheduleId, setSelectedBatchScheduleId] = useState<number | null>(null)
  const [isImplementModalOpen, setIsImplementModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const rowsPerPage = 10

  const loadUpcomingVaccinations = useCallback(async () => {
    if (!token || !farmId || !flockId) {
      setUpcomingVaccinations([])
      setLoadingUpcoming(false)
      return
    }

    setLoadingUpcoming(true)
    try {
      const response = await getFlockNotifications(token, farmId, flockId)
      if (response.success && response.data) {
        setUpcomingVaccinations(
          mapUpcomingVaccinations(response.data, vaccinationSchedules)
        )
        setReminderWindowDays(response.data.settings?.schedule_reminder_days ?? 7)
      } else {
        setUpcomingVaccinations([])
        const message = Array.isArray(response.error) ? response.error.join(", ") : "Failed to load upcoming vaccinations"
        toast.error(message)
      }
    } catch {
      setUpcomingVaccinations([])
      toast.error("Failed to load upcoming vaccinations")
    } finally {
      setLoadingUpcoming(false)
    }
  }, [token, farmId, flockId, vaccinationSchedules])

  useEffect(() => {
    void loadUpcomingVaccinations()
  }, [loadUpcomingVaccinations])

  const handleMarkDone = (item: UpcomingVaccinationItem) => {
    if (!item.scheduleItem) {
      toast.info("Open the batch schedule to record this vaccination.")
      onOpenSchedule?.()
      return
    }
    setSelectedScheduleItem(item.scheduleItem)
    setSelectedBatchScheduleId(item.batchScheduleId)
    setIsImplementModalOpen(true)
  }

  const handleImplementSuccess = async () => {
    setIsImplementModalOpen(false)
    setSelectedScheduleItem(null)
    setSelectedBatchScheduleId(null)
    await onRefresh?.()
    await loadUpcomingVaccinations()
  }

  const handleAddVaccinationRecord = async (recordData: VaccinationRecordFormData) => {
    if (onAddVaccinationRecord) {
      await onAddVaccinationRecord(recordData)
      setIsAddModalOpen(false)
    }
  }

  const handleDeleteClick = (record: PoultryVaccinationRecord) => {
    setRecordToDelete(record)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (recordToDelete && onDeleteVaccinationRecord) {
      setDeletingRecordId(recordToDelete.id)
      try {
        await onDeleteVaccinationRecord(recordToDelete.id)
        setIsDeleteDialogOpen(false)
        setRecordToDelete(null)
      } finally {
        setDeletingRecordId(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setRecordToDelete(null)
  }

  // Pagination handled above with page / rowsPerPage

  const filteredRecords = useMemo(
    () => records.filter((record) => isDateInRange(record.date, dateFrom, dateTo)),
    [records, dateFrom, dateTo]
  )

  useEffect(() => {
    setPage(1)
  }, [records, dateFrom, dateTo])

  const paginatedRecords = filteredRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const totalVaccinations = filteredRecords.length
  const totalCost = filteredRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0)
  const uniqueVaccines = new Set(filteredRecords.map((r) => r.vaccine?.name).filter(Boolean)).size

  const overdueCount = useMemo(
    () => upcomingVaccinations.filter((item) => item.daysUntil < 0).length,
    [upcomingVaccinations]
  )

  const priorityBadgeLabel = (item: UpcomingVaccinationItem) => {
    if (item.daysUntil < 0) return "OVERDUE"
    if (item.daysUntil === 0) return "DUE TODAY"
    return item.priority.toUpperCase()
  }

  const daysDisplay = (item: UpcomingVaccinationItem) => {
    if (item.daysUntil < 0) return Math.abs(item.daysUntil)
    return item.daysUntil
  }

  const daysDisplayCaption = (item: UpcomingVaccinationItem) => {
    if (item.daysUntil < 0) return "LATE"
    if (item.daysUntil === 0) return "TODAY"
    return "DAYS"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vaccinations</p>
              <p className="text-2xl font-bold text-blue-600">{totalVaccinations}</p>
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
              <p className="text-2xl font-bold text-green-600">{Naira}{formatCurrency(totalCost || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Vaccines</p>
              <p className="text-2xl font-bold text-purple-600">{uniqueVaccines}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Vaccinations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void loadUpcomingVaccinations()}
              disabled={loadingUpcoming}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingUpcoming ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUpcoming ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading upcoming vaccinations...
            </div>
          ) : (
          <div className="space-y-4">
            {upcomingVaccinations.map((vaccination) => (
              <div
                key={vaccination.key}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow ${
                  vaccination.daysUntil < 0
                    ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
                    : vaccination.daysUntil === 0
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg border-2 ${
                    vaccination.daysUntil < 0 ? "border-red-200" : vaccination.daysUntil === 0 ? "border-amber-200" : "border-blue-200"
                  }`}>
                    <span className={`text-2xl font-bold ${
                      vaccination.daysUntil < 0 ? "text-red-600" : vaccination.daysUntil === 0 ? "text-amber-600" : "text-blue-600"
                    }`}>{daysDisplay(vaccination)}</span>
                    <span className={`text-xs font-medium ${
                      vaccination.daysUntil < 0 ? "text-red-500" : vaccination.daysUntil === 0 ? "text-amber-500" : "text-blue-500"
                    }`}>{daysDisplayCaption(vaccination)}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{vaccination.vaccineName}</h4>
                      <Badge className={`${priorityColors[vaccination.priority]} font-medium text-xs`}>
                        {priorityBadgeLabel(vaccination)}
                      </Badge>
                      {vaccination.scheduleName && (
                        <Badge variant="outline" className="text-xs">
                          {vaccination.scheduleName}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(vaccination.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Age: {vaccination.flockAgeAtVaccination} days</span>
                      </div>
                      {vaccination.administrationMethod && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span>{vaccination.administrationMethod}</span>
                        </div>
                      )}
                      {vaccination.doseLabel && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>Dose: {vaccination.doseLabel}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">{urgencyLabel(vaccination.daysUntil)}</p>
                    {vaccination.notes && <p className="text-xs text-gray-500 mt-1 italic">{vaccination.notes}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-2">
                  <div className="text-left lg:text-right">
                    {vaccination.estimatedCost != null ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">{Naira}{formatCurrency(vaccination.estimatedCost)}</p>
                        <p className="text-xs text-gray-500">Estimated Cost</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Cost recorded at administration</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {onAddVaccinationRecord && (
                      <Button
                        size="sm"
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleMarkDone(vaccination)}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Mark Done
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {upcomingVaccinations.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming vaccinations scheduled</p>
                <p className="text-sm text-gray-400">
                  {vaccinationSchedules.length === 0
                    ? "Assign a vaccination schedule to this flock to see due dates here."
                    : "All vaccinations in your reminder window are up to date."}
                </p>
              </div>
            )}
          </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{upcomingVaccinations.length}</span> vaccination
                {upcomingVaccinations.length === 1 ? "" : "s"} in the next {reminderWindowDays} day
                {reminderWindowDays === 1 ? "" : "s"}
                {overdueCount > 0 && (
                  <span className="text-red-600 font-medium"> · {overdueCount} overdue</span>
                )}
              </div>
              {onOpenSchedule && (
                <Button variant="outline" size="sm" onClick={onOpenSchedule}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Schedule
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <RecordsDateRangeFilter
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          rangeLabel={rangeLabel}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            Showing {filteredRecords.length} of {records.length}
          </span>
          {onAddVaccinationRecord && (
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              size="sm"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vaccination
            </Button>
          )}
          <ExportDataButton
            rows={filteredRecords}
            columns={VACCINATION_EXPORT_COLUMNS}
            filename={buildExportFilename(flockName || "flock", "vaccination")}
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vaccine</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Administered By</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => {
                const isExpiringSoon =
                  new Date(record.vaccine_inventory.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.vaccine.name}</p>
                        <p className="text-xs text-gray-500">{record.vaccine.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              record.vaccine.type === "live"
                                ? "border-green-200 text-green-700"
                                : "border-blue-200 text-blue-700"
                            }`}
                          >
                            {record.vaccine.type}
                          </Badge>
                          {record.vaccine.administration_age && (
                            <span className="text-xs text-gray-500">Age: {record.vaccine.administration_age} days</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {record.dosage} {record.dosage_unit}
                      </span>
                    </TableCell>
                    <TableCell>{(Number(record.quantity) || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{Naira}{formatCurrency(Number(record.cost) || 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {record.administered_by}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.administration_method.name}</p>
                        <p className="text-xs text-gray-500">{record.administration_method.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-gray-400" />
                        {record.vaccine_inventory.manufacturer}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Package2 className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{record.vaccine_inventory.batch_number}</span>
                        </div>
                        <div
                          className={`text-xs mt-1 ${isExpiringSoon ? "text-orange-600 font-medium" : "text-gray-500"}`}
                        >
                          Exp: {formatDate(record.vaccine_inventory.expiry_date)}
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
                      <Badge className={`${vaccineStatusColors[record.vaccine_inventory.status.toLowerCase()]} font-medium text-xs`}>
                        {record.vaccine_inventory.status.replace("_", " ").toUpperCase()}
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(record)}
                          disabled={deletingRecordId === record.id}
                        >
                          {deletingRecordId === record.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
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

      {/* Vaccination Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vaccination Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(records.map((r) => r.vaccine.name))).map((vaccineName) => {
              const vaccineRecords = records.filter((r) => r.vaccine.name === vaccineName)
              const vaccineQuantity = vaccineRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
              const vaccineCost = vaccineRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
              const vaccine = vaccineRecords[0].vaccine
              const lastAdministered = vaccineRecords.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )[0]

              return (
                <Card key={vaccineName} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">{vaccineName}</h4>
                    </div>
                    <p className="text-xs text-gray-600">{vaccine.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Quantity</p>
                        <p className="font-medium">{(vaccineQuantity || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-medium">{Naira}{formatCurrency(vaccineCost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Administrations</p>
                        <p className="font-medium">{vaccineRecords.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Given</p>
                        <p className="font-medium text-xs">{formatDate(lastAdministered.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          vaccine.type === "live" ? "border-green-200 text-green-700" : "border-blue-200 text-blue-700"
                        }`}
                      >
                        {vaccine.type}
                      </Badge>
                      {vaccine.administration_age && (
                        <span className="text-xs text-gray-500">Age: {vaccine.administration_age} days</span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Vaccination Record Modal */}
      <AddVaccinationRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVaccinationRecord}
        flockId={flockId}
        farmId={farmId}
        vaccines={vaccines}
        vaccineInventories={vaccineInventories}
        administrationMethods={administrationMethods}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Vaccination Record"
        description={`Are you sure you want to delete the vaccination record for "${recordToDelete?.vaccine?.name || 'this vaccine'}" administered on ${recordToDelete ? formatDate(recordToDelete.date) : ''}? This action cannot be undone and will restore the vaccine inventory.`}
        itemName={recordToDelete?.vaccine?.name}
        isLoading={deletingRecordId === recordToDelete?.id}
      />

      {selectedScheduleItem && selectedBatchScheduleId && (
        <ImplementScheduleModal
          open={isImplementModalOpen}
          onOpenChange={setIsImplementModalOpen}
          scheduleItem={selectedScheduleItem}
          batchScheduleId={selectedBatchScheduleId}
          scheduleType="vaccination"
          currentAge={currentAge}
          onSuccess={() => void handleImplementSuccess()}
        />
      )}
    </div>
  )
}

export default VaccinationRecordView;