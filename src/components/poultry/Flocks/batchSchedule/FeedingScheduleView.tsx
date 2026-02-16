import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Wheat, 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  ClipboardCheck
} from "lucide-react"
import type { BatchFeedingSchedule } from "@/lib/types"
import ImplementFeedingScheduleModal from "./ImplementFeedingScheduleModal"

interface FeedingScheduleViewProps {
  schedule: BatchFeedingSchedule
  flockQuantity: number
  onRefresh?: () => void
}

const FeedingScheduleView = ({ schedule, flockQuantity, onRefresh }: FeedingScheduleViewProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [implementModalOpen, setImplementModalOpen] = useState(false)
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<any>(null)
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ongoing':
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
  const pendingItems = allScheduleItems.length - executedItems.length  // Items not yet in batch schedule
  const totalQuantity = executedItems.reduce((sum, item) => sum + (Number(item.actual_quantity || 0) * flockQuantity), 0)

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wheat className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {schedule.schedule.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {schedule.schedule.description || "Feeding schedule for the flock"}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <div className="text-xs text-gray-600">Total Feedings</div>
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
              <div className="text-2xl font-bold text-orange-600">{(totalQuantity / 1000).toFixed(2)}kg</div>
              <div className="text-xs text-gray-600">Total Feed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feeding Items */}
      {isExpanded && (
        <div className="space-y-3">
          {allScheduleItems.map((scheduleItem, index) => {
            // Find matching executed item
            const executedItem = executedItems.find(ei => ei.feeding_schedule_item_id === scheduleItem.id)
            
            // Determine status - if item exists in batch schedule, it's completed; otherwise pending
            const status = executedItem ? 'completed' : 'pending'
            
            // Use actual data from executed item if completed, otherwise use planned data
            const feedingTimes = executedItem?.actual_feeding_time || scheduleItem.feeding_times || []
            const totalDailyQuantityPerBird = executedItem ? Number(executedItem.actual_quantity || 0) : Number(scheduleItem.quantity || 0)
            const totalDailyQuantity = totalDailyQuantityPerBird * flockQuantity

            // Calculate variance for completed items
            const plannedQuantityPerBird = Number(scheduleItem.quantity || 0)
            const plannedQuantity = plannedQuantityPerBird * flockQuantity
            const actualQuantityPerBird = executedItem ? Number(executedItem.actual_quantity || 0) : 0
            const actualQuantity = actualQuantityPerBird * flockQuantity
            const quantityDifference = actualQuantity - plannedQuantity
            const quantityVariancePercent = plannedQuantity > 0 ? ((quantityDifference / plannedQuantity) * 100) : 0

            // Calculate feeding time variance
            const plannedFeedingTimes = scheduleItem.feeding_times || []
            const actualFeedingTimes = Array.isArray(executedItem?.actual_feeding_time) ? executedItem.actual_feeding_time : []
            const timeDifference = actualFeedingTimes.length - plannedFeedingTimes.length
            
            // Check if any times are different (not just count)
            const hasTimeDifferences = actualFeedingTimes.some((actual: any, idx: number) => {
              const planned = plannedFeedingTimes[idx]
              return planned && (actual.time !== planned.time || actual.percentage !== planned.percentage)
            })

            return (
              <Card 
                key={scheduleItem.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
              >
                <CardContent className="p-5">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                        <span className="text-orange-700 font-bold text-sm">
                          {scheduleItem.feeding_day || index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Day {scheduleItem.feeding_day || index + 1} Feeding
                        </div>
                        {executedItem && (
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(executedItem.feeding_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
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
                      {scheduleItem.feed_type_id && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Wheat className="h-3 w-3" />
                          Feed Type #{scheduleItem.feed_type_id}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Info */}
                  {status === 'completed' && executedItem ? (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Planned Quantity</div>
                          <div className="text-base font-semibold text-gray-700">
                            {(plannedQuantity / 1000).toFixed(2)} kg
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {plannedQuantityPerBird.toFixed(1)}g per bird
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Actual Quantity</div>
                          <div className="text-base font-semibold text-green-700">
                            {(actualQuantity / 1000).toFixed(2)} kg
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {actualQuantityPerBird.toFixed(1)}g per bird
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Variance</div>
                          <div className={`text-base font-bold ${quantityVariancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {quantityVariancePercent > 0 ? '+' : ''}{quantityVariancePercent.toFixed(1)}%
                          </div>
                          <div className={`text-xs mt-0.5 ${quantityDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {quantityDifference > 0 ? '+' : ''}{(quantityDifference / 1000).toFixed(2)} kg
                          </div>
                        </div>
                      </div>
                      {/* Visual variance indicator */}
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute h-full ${quantityVariancePercent >= 0 ? 'bg-green-500' : 'bg-red-500'} transition-all`}
                          style={{ 
                            width: `${Math.min(Math.abs(quantityVariancePercent), 100)}%`,
                            left: quantityVariancePercent >= 0 ? '50%' : `${50 - Math.min(Math.abs(quantityVariancePercent), 50)}%`
                          }}
                        ></div>
                        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-400"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Under</span>
                        <span className="font-medium">Target</span>
                        <span>Over</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Planned Quantity</div>
                        <div className="text-lg font-bold text-gray-900">
                          {(totalDailyQuantity / 1000).toFixed(2)} kg
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ({totalDailyQuantityPerBird.toFixed(1)}g per bird × {flockQuantity} birds)
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="text-lg font-bold text-amber-600">
                          Pending
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Not fed yet
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feeding Times */}
                  {status === 'completed' && executedItem ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-700">
                            Feeding Time Comparison
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {timeDifference !== 0 && (
                            <Badge className={`${timeDifference > 0 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'} border`}>
                              {timeDifference > 0 ? '+' : ''}{timeDifference} {Math.abs(timeDifference) === 1 ? 'feeding' : 'feedings'}
                            </Badge>
                          )}
                          {hasTimeDifferences && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-300 border">
                              Times Modified
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Side by side comparison */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* Planned Times */}
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            Planned ({plannedFeedingTimes.length} times)
                          </div>
                          <div className="space-y-2">
                            {plannedFeedingTimes.map((time: any, idx: number) => {
                              const plannedPercentage = Number(time.percentage || 0)
                              const plannedQtyPerBird = (plannedQuantityPerBird * plannedPercentage) / 100
                              const plannedQtyForFlock = (plannedQuantity * plannedPercentage) / 100
                              const actualTime = actualFeedingTimes[idx]
                              const isDifferent = actualTime && (actualTime.time !== time.time || Number(actualTime.percentage) !== plannedPercentage)
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`flex flex-col gap-1 text-xs bg-white p-2 rounded border ${isDifferent ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">{time.time}</span>
                                    <span className="text-purple-600">{plannedPercentage}%</span>
                                  </div>
                                  <div className="flex items-center justify-between text-gray-500">
                                    <span>{(plannedQtyForFlock / 1000).toFixed(2)}kg</span>
                                    <span className="text-gray-400">{plannedQtyPerBird.toFixed(1)}g/bird</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        
                        {/* Actual Times */}
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-xs font-semibold text-green-700 mb-2">
                            Actual ({actualFeedingTimes.length} times)
                          </div>
                          <div className="space-y-2">
                            {actualFeedingTimes.map((time: any, idx: number) => {
                              const percentage = Number(time.percentage || 0)
                              const quantityPerBird = (actualQuantityPerBird * percentage) / 100
                              const totalQuantityForFlock = (actualQuantity * percentage) / 100
                              const plannedTime = plannedFeedingTimes[idx]
                              const isDifferent = plannedTime && (plannedTime.time !== time.time || Number(plannedTime.percentage) !== percentage)
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`p-2 rounded border ${isDifferent ? 'bg-amber-50 border-amber-400' : 'bg-white border-green-300'}`}
                                >
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className={`font-semibold ${isDifferent ? 'text-amber-900' : 'text-green-900'}`}>
                                      {time.time}
                                      {plannedTime && time.time !== plannedTime.time && (
                                        <span className="ml-1 text-amber-600 text-[10px]">
                                          (was {plannedTime.time})
                                        </span>
                                      )}
                                    </span>
                                    <span className={`font-semibold ${isDifferent && percentage !== Number(plannedTime?.percentage) ? 'text-amber-700' : 'text-purple-600'}`}>
                                      {percentage}%
                                      {plannedTime && percentage !== Number(plannedTime.percentage) && (
                                        <span className="ml-1 text-amber-600 text-[10px]">
                                          (was {Number(plannedTime.percentage)}%)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>{(totalQuantityForFlock / 1000).toFixed(2)}kg</span>
                                    <span className="text-gray-400">{quantityPerBird.toFixed(1)}g/bird</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : feedingTimes.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          Feeding Schedule ({feedingTimes.length} times/day)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {(Array.isArray(feedingTimes) ? feedingTimes : []).map((time: any, idx: number) => {
                          const percentage = Number(time.percentage || 0)
                          const quantityPerBird = (totalDailyQuantityPerBird * percentage) / 100
                          const totalQuantityForFlock = (totalDailyQuantity * percentage) / 100

                          return (
                            <div 
                              key={idx}
                              className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3 hover:shadow-md transition-all"
                            >
                              <div className="absolute top-1 right-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-bold text-blue-900">{time.time}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Portion:</span>
                                  <span className="font-semibold text-purple-700">{percentage}%</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-semibold text-indigo-700">{(totalQuantityForFlock / 1000).toFixed(2)}kg</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">Per bird:</span>
                                  <span className="font-medium text-gray-500">{quantityPerBird.toFixed(1)}g</span>
                                </div>
                              </div>
                              {/* Visual percentage bar */}
                              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Progress Indicator */}
                  {status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>Feeding completed successfully</span>
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="mt-4 flex items-center justify-between gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-sm text-amber-700">
                        <Clock className="h-4 w-4" />
                        <span>Pending - Not yet fed</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedScheduleItem(scheduleItem)
                          setImplementModalOpen(true)
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        Implement
                      </Button>
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
                <div className="font-semibold text-amber-900">Pending Feedings</div>
                <div className="text-sm text-amber-700">
                  {pendingItems} feeding{pendingItems > 1 ? 's' : ''} pending. Please review and schedule feed distribution.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implement Feeding Modal */}
      {selectedScheduleItem && (
        <ImplementFeedingScheduleModal
          open={implementModalOpen}
          onOpenChange={setImplementModalOpen}
          scheduleItem={selectedScheduleItem}
          batchScheduleId={schedule.id}
          flockQuantity={flockQuantity}
          onSuccess={() => {
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}

export default FeedingScheduleView
