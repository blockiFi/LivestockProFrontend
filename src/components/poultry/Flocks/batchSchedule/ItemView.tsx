import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BatchFeedingSchedule, BatchSchedule, BatchScheduleItem, Schedule } from "@/lib/types"
import { formatDate, Naira } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { AlertCircle, Check, ChevronDown, ChevronUp, Clock, DollarSign, Edit, FileText, Pill, Shield, Syringe, Thermometer, Trash2, User, Wheat } from "lucide-react"
import { useState } from "react"
const scheduleTypeIcons = {
  medication: <Pill className="h-5 w-5" />,
  vaccination: <Shield className="h-5 w-5" />,
  feeding: <Wheat className="h-5 w-5" />,
}

const scheduleTypeColors = {
  medication: "bg-purple-100 text-purple-600",
  vaccination: "bg-blue-100 text-blue-600",
  feeding: "bg-green-100 text-green-600",
}
const statusIcons = {
    scheduled: <Clock className="h-3 w-3" />,
    administered: <Check className="h-3 w-3" />,
    overdue: <AlertCircle className="h-3 w-3" />,
    cancelled: <Trash2 className="h-3 w-3" />,
  }
  const itemStatusColors = {
  scheduled: "bg-sky-100 text-sky-800 border-sky-200",
  administered: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
}
const ItemView = ({ schedule , item }: { schedule: BatchSchedule , item:  BatchScheduleItem}) => {
    const [isExpanded, setIsExpanded] = useState(false);
  return (
 
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors duration-150 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${scheduleTypeColors[schedule.schedule.schedule_type as keyof typeof scheduleTypeColors]}`}>
                {scheduleTypeIcons[schedule.schedule.schedule_type as keyof typeof scheduleTypeIcons]}
              </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{item.schedule_item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${itemStatusColors[item.status as keyof typeof itemStatusColors]} font-medium text-xs`}>
                      {statusIcons[item.status as keyof typeof statusIcons]}
                      <span className="ml-1">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    </Badge>
                    <span className="text-sm text-gray-500">Age: {item.schedule_item.age_days} days</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDate(item.scheduled_date)}</p>
               
                   {
                    item.status === 'completed' && item.actual_date && (
                    <p className="text-xs text-green-600">Completed: {formatDate(item.actual_date)}</p>
                    )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">
                  {
                    schedule.schedule.schedule_type != 'feeding' ? 
                    "Quantity Per Bird - Total Quantity" :
                    "Dosage & Quantity"
                  }
                  </p>
                  <p className="font-medium">
                   {
                    schedule.schedule.schedule_type != 'feeding' ?
                  `${item.schedule_item.dose} • ${item.quantity} ${item.schedule_item.dose_unit}`
                   :
                   `${item.schedule_item.dose} • ${item.schedule_item.dose} Kg` 
                   }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-4 w-4 text-gray-500" >{Naira}</span>
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="font-medium">{`${Naira} ${item.cost}`}</p>
                </div>
              </div>
              { schedule.schedule.schedule_type != 'feeding' &&
                 <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-gray-500" />
                 <div>
                   <p className="text-xs text-gray-500">Withdrawal Period</p>
                   <p className="font-medium">{item.schedule_item.withdrawal_period_days} days</p>
                 </div>
                
               </div>
              }
               
              

      
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">
                     "Managed By" : 
                    </p>
                    <p className="font-medium">{item.administered_by}</p>
                  </div>
                </div>
            
               </div>

               { schedule.schedule.schedule_type != 'feeding' &&
              <>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Thermometer className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 mb-1">Storage Instructions</p>
                    <p className="text-sm text-amber-700">{item.schedule_item.storage_instructions}</p>
                  </div>
                </div>
              </div>
            

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800 mb-1">Notes</p>
                    <p className="text-sm text-blue-700">{item.notes}</p>
                  </div>
                </div>
              </div>
              </>
}

            <div className="flex items-center gap-2 pt-2 mb-6">
             
                <Button
                  size="sm"
                 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark as Done
                </Button>
            
              <Button size="sm" variant="outline" >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
               
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
  )
}

export default ItemView
