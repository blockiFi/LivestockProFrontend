import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { PoultryVaccinationRecord, vaccine, PoultryVaccineInventory, AdministrationMethod } from "@/lib/types";
import { formatDate, Naira } from "@/lib/utils";
import { Activity, AlertTriangle, Calendar, Download, Eye, Factory, Package2, Shield, User, Users, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AddVaccinationRecordModal, { type VaccinationRecordFormData } from "@/components/modals/AddVaccinationRecordModal"
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog"

interface VaccinationRecordViewProps {
  records: PoultryVaccinationRecord[]
  flockId: number
  farmId: number
  vaccines?: vaccine[]
  vaccineInventories?: PoultryVaccineInventory[]
  administrationMethods?: AdministrationMethod[]
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
  available: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
}
const VaccinationRecordView = ({ 
  records, 
  flockId, 
  farmId, 
  vaccines = [], 
  vaccineInventories = [], 
  administrationMethods = [],
  onAddVaccinationRecord,
  onDeleteVaccinationRecord
}: VaccinationRecordViewProps) => {
  const [dateFilter, setDateFilter] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<PoultryVaccinationRecord | null>(null)

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

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredRecords = useMemo(() => {
    if (!dateFilter) return records
    return records.filter((record) => record.date.includes(dateFilter))
  }, [records, dateFilter])

  // Paginate filtered records
  const paginatedRecords = filteredRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalVaccinations = records.length
  const totalCost = records.reduce((sum, record) => sum + (Number(record.cost) || 0), 0)
  const uniqueVaccines = new Set(records.map((r) => r.vaccine.name)).size

  // Add this mock data for upcoming vaccinations after the existing calculations
  const upcomingVaccinations = [
    {
      id: 1,
      vaccine_name: "IBD Vaccine - Booster",
      scheduled_date: "2025-01-15",
      days_until: 13,
      flock_age_at_vaccination: 28,
      administration_method: "Oral",
      estimated_cost: 450.0,
      priority: "high",
      notes: "Second dose required for full immunity",
    },
    {
      id: 2,
      vaccine_name: "Newcastle Disease - Booster",
      scheduled_date: "2025-01-20",
      days_until: 18,
      flock_age_at_vaccination: 33,
      administration_method: "Eye Drop",
      estimated_cost: 890.5,
      priority: "medium",
      notes: "Annual booster vaccination",
    },
    {
      id: 3,
      vaccine_name: "Fowl Pox Vaccine",
      scheduled_date: "2025-01-25",
      days_until: 23,
      flock_age_at_vaccination: 38,
      administration_method: "Wing-Web",
      estimated_cost: 320.75,
      priority: "low",
      notes: "Optional vaccination based on regional risk",
    },
  ]

  // Add this section right after the summary cards div and before the date filter
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
              <p className="text-2xl font-bold text-green-600">${(totalCost || 0).toFixed(2)}</p>
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Vaccinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingVaccinations.map((vaccination) => (
              <div
                key={vaccination.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg border-2 border-blue-200">
                    <span className="text-2xl font-bold text-blue-600">{vaccination.days_until}</span>
                    <span className="text-xs text-blue-500 font-medium">DAYS</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{vaccination.vaccine_name}</h4>
                      <Badge className={`${priorityColors[vaccination.priority]} font-medium text-xs`}>
                        {vaccination.priority.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(vaccination.scheduled_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Age: {vaccination.flock_age_at_vaccination} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{vaccination.administration_method}</span>
                      </div>
                    </div>

                    {vaccination.notes && <p className="text-xs text-gray-500 mt-1 italic">{vaccination.notes}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${vaccination.estimated_cost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-3 bg-transparent">
                      <Calendar className="h-3 w-3 mr-1" />
                      Reschedule
                    </Button>
                    <Button size="sm" className="h-8 px-3 bg-blue-600 hover:bg-blue-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Mark Done
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {upcomingVaccinations.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming vaccinations scheduled</p>
                <p className="text-sm text-gray-400">All vaccinations are up to date</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{upcomingVaccinations.length}</span> vaccinations scheduled in the next 30
                days
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Full Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="vaccination-date-filter">Filter by Date</Label>
          <Input
            id="vaccination-date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
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
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
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
                    <TableCell className="font-medium">${(Number(record.cost) || 0).toFixed(2)}</TableCell>
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
                        <p className="font-medium">${(vaccineCost || 0).toFixed(2)}</p>
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
    </div>
  )
}

export default VaccinationRecordView;