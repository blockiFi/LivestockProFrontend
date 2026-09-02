import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Syringe,
  User,
  Plus,
} from "lucide-react"
import type { BatchSchedule, BatchScheduleItem, ScheduleItem } from "@/lib/types"
import { buildMedVacDisplayRows, formatRecurrenceLabel } from "@/lib/medVacScheduleRows"
import ImplementScheduleModal from "./ImplementScheduleModal"

interface VaccinationScheduleViewProps {
  schedule: BatchSchedule
  currentAge: number
  onRefresh?: () => void
  readOnly?: boolean
}

const VaccinationScheduleView = ({ schedule, currentAge, onRefresh, readOnly = false }: VaccinationScheduleViewProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null)
  const [selectedBatchItem, setSelectedBatchItem] = useState<BatchScheduleItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const displayRows = useMemo(() => buildMedVacDisplayRows(schedule, currentAge), [schedule, currentAge])

  const handleImplementClick = (scheduleItem: ScheduleItem, batchItem?: BatchScheduleItem) => {
    setSelectedScheduleItem(scheduleItem)
    setSelectedBatchItem(batchItem ?? null)
    setIsModalOpen(true)
  }

  const totalItems = displayRows.length
  const completedItems = displayRows.filter((row) => row.status === "completed" || row.status === "late").length
  const pendingItems = displayRows.filter((row) => row.status === "scheduled" || row.status === "pending").length
  const totalCost = (schedule.items || []).reduce((sum, item) => sum + Number(item.cost || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "late":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
      case "scheduled":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "missed":
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "late":
        return <CheckCircle className="h-4 w-4" />
      case "missed":
      case "overdue":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">{schedule.schedule.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {schedule.schedule.description || "Vaccination schedule for the flock"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getStatusColor(schedule.status)} border px-3 py-1`}>
                {schedule.status.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div className="text-xs text-gray-600">Total Occurrences</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedItems}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingItems}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isExpanded && (
        <div className="space-y-3">
          {displayRows.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No vaccination occurrences scheduled for this flock yet.
              </CardContent>
            </Card>
          ) : (
            displayRows.map((row, index) => {
              const { scheduleItem, batchItem, scheduledDate, status } = row
              const recurrenceLabel = formatRecurrenceLabel(scheduleItem)
              const scheduledDateObj = scheduledDate ? new Date(scheduledDate) : null
              const actualDate = batchItem?.actual_date ? new Date(batchItem.actual_date) : null
              const canImplement = !readOnly && status !== "completed" && status !== "late"

              return (
                <Card key={row.key} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {scheduleItem.name || `Day ${scheduleItem.age_days || index + 1} Vaccination`}
                          </div>
                          {recurrenceLabel && (
                            <p className="text-xs text-blue-700 mt-1">{recurrenceLabel}</p>
                          )}
                          {scheduledDateObj && (
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Scheduled: {scheduledDateObj.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {actualDate && (
                            <div className="flex items-center gap-2 mt-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">
                                Administered: {actualDate.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${getStatusColor(status)} border flex items-center gap-1`}>
                          {getStatusIcon(status)}
                          {status}
                        </Badge>
                        {canImplement && (
                          <Button
                            size="sm"
                            onClick={() => handleImplementClick(scheduleItem, batchItem)}
                            className={
                              status === "missed"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {status === "missed" ? "Implement Late" : "Implement"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Syringe className="h-4 w-4 text-blue-600" />
                          <div className="text-xs text-gray-500">Dosage</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {batchItem?.dosage || scheduleItem.dose} {scheduleItem.dose_unit || "dose"}
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-cyan-600" />
                          <div className="text-xs text-gray-500">Quantity</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {batchItem ? Number(batchItem.quantity || 0).toFixed(2) : "-"}
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-gray-900">
                          {batchItem?.cost != null ? `$${Number(batchItem.cost).toFixed(2)}` : "-"}
                        </div>
                      </div>
                    </div>

                    {scheduleItem.description && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">{scheduleItem.description}</p>
                      </div>
                    )}

                    {batchItem?.administered_by && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                        <User className="h-4 w-4" />
                        <span>Administered by: {batchItem.administered_by}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {selectedScheduleItem && (
        <ImplementScheduleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          scheduleItem={selectedScheduleItem}
          batchScheduleItem={selectedBatchItem}
          batchScheduleId={schedule.id}
          scheduleType="vaccination"
          currentAge={currentAge}
          onSuccess={() => onRefresh?.()}
        />
      )}
    </div>
  )
}

export default VaccinationScheduleView
