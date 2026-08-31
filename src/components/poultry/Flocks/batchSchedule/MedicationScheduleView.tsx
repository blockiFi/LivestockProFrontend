import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Pill, 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Syringe,
  User,
  Plus
} from "lucide-react"
import type { BatchSchedule, ScheduleItem } from "@/lib/types"
import ImplementScheduleModal from "./ImplementScheduleModal"

interface MedicationScheduleViewProps {
  schedule: BatchSchedule
  currentAge: number
  onRefresh?: () => void
  readOnly?: boolean
}

const MedicationScheduleView = ({ schedule, currentAge, onRefresh, readOnly = false }: MedicationScheduleViewProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleImplementClick = (item: ScheduleItem) => {
    setSelectedScheduleItem(item)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    onRefresh?.()
  }
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'missed':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'active':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'missed':
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Calculate statistics using schedule items as base
  const allScheduleItems = schedule.schedule?.items || []
  const executedItems = schedule.items || []
  
  const totalItems = allScheduleItems.length
  const completedItems = executedItems.length  // All items in batch schedule are completed
  const pendingItems = allScheduleItems.filter((item) => {
    const executed = executedItems.find(ei => ei.schedule_item_id === item.id)
    if (executed) return false
    return typeof item.age_days === "number" ? item.age_days >= currentAge : true
  }).length
  const totalCost = executedItems.reduce((sum, item) => sum + Number(item.cost || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Pill className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {schedule.schedule.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {schedule.schedule.description || "Medication schedule for the flock"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getStatusColor(schedule.status)} border px-3 py-1`}>
                {schedule.status.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8"
              >
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

        {/* Statistics Bar */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div className="text-xs text-gray-600">Total Treatments</div>
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
              <div className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medication Items */}
      {isExpanded && (
        <div className="space-y-3">
          {allScheduleItems.map((scheduleItem, index) => {
            // Find matching executed item
            const executedItem = executedItems.find(ei => ei.schedule_item_id === scheduleItem.id)
            const scheduledDate = executedItem ? new Date(executedItem.scheduled_date) : null
            const actualDate = executedItem?.actual_date ? new Date(executedItem.actual_date) : null
            
            // Determine status relative to current flock age:
            // - completed: has executed batch item
            // - missed: no execution and scheduled age_days < currentAge
            // - pending: otherwise
            let status: 'completed' | 'pending' | 'missed' = 'pending'
            if (executedItem) {
              status = 'completed'
            } else if (typeof scheduleItem.age_days === 'number' && scheduleItem.age_days < currentAge) {
              status = 'missed'
            }

            return (
              <Card 
                key={scheduleItem.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
              >
                <CardContent className="p-5">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                        <span className="text-purple-700 font-bold text-sm">
                          {scheduleItem.age_days || index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {scheduleItem.name || `Day ${scheduleItem.age_days || index + 1} Medication`}
                        </div>
                        {scheduledDate && (
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Scheduled: {scheduledDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {actualDate && (
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              Administered: {actualDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
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
                      {scheduleItem.age_days && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Age: {scheduleItem.age_days} days
                        </div>
                      )}
                      {(status === 'pending' || status === 'missed') && !readOnly && (
                        <Button
                          size="sm"
                          onClick={() => handleImplementClick(scheduleItem)}
                          className={
                            status === 'missed'
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {status === 'missed' ? 'Implement Late' : 'Implement Schedule'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Medication Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Syringe className="h-4 w-4 text-blue-600" />
                        <div className="text-xs text-gray-500">Dosage</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {executedItem?.dosage || scheduleItem.dose} {scheduleItem.dose_unit || 'mL'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Per bird dosage
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-4 w-4 text-purple-600" />
                        <div className="text-xs text-gray-500">Quantity</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {executedItem ? Number(executedItem.quantity || 0).toFixed(2) : '-'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {executedItem ? 'Total quantity used' : 'Not administered yet'}
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div className="text-xs text-gray-500">Cost</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {executedItem ? `$${Number(executedItem.cost || 0).toFixed(2)}` : '-'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {executedItem ? 'Treatment cost' : 'Not administered yet'}
                      </div>
                    </div>
                  </div>

                  {/* Description & Notes */}
                  {scheduleItem.description && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Description</div>
                      <p className="text-sm text-gray-600">{scheduleItem.description}</p>
                    </div>
                  )}

                  {executedItem?.notes && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs font-semibold text-blue-700 mb-1">Notes</div>
                      <p className="text-sm text-blue-600">{executedItem.notes}</p>
                    </div>
                  )}

                  {/* Administered By */}
                  {executedItem?.administered_by && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                      <User className="h-4 w-4" />
                      <span>Administered by: Staff #{executedItem.administered_by}</span>
                    </div>
                  )}

                  {/* Withdrawal Period */}
                  {scheduleItem.withdrawal_period_days > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
                      <AlertCircle className="h-4 w-4" />
                      <span>Withdrawal period: {scheduleItem.withdrawal_period_days} days</span>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  {status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>Treatment completed successfully</span>
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <Clock className="h-4 w-4" />
                      <span>Pending - Not yet administered</span>
                    </div>
                  )}
                  {status === 'missed' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <span>Missed - Age for this treatment has passed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary Footer */}
      {pendingItems > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-semibold text-amber-900">Pending Treatments</div>
                <div className="text-sm text-amber-700">
                  {pendingItems} treatment{pendingItems > 1 ? 's' : ''} pending. Please review and schedule administration.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implement Schedule Modal */}
      {selectedScheduleItem && (
        <ImplementScheduleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          scheduleItem={selectedScheduleItem}
          batchScheduleId={schedule.id}
          scheduleType="medication"
          currentAge={currentAge}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}

export default MedicationScheduleView
