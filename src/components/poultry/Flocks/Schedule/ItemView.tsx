import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DetailedSchedule, ScheduleItem } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { ChevronDown, ChevronUp, Pill, Shield, Syringe, Thermometer, Wheat } from "lucide-react"
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
const ItemView = ({ schedule , item }: { schedule: DetailedSchedule , item:  ScheduleItem}) => {
    const [isExpanded, setIsExpanded] = useState(false);
  return (
 
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors duration-150 pb-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${scheduleTypeColors[schedule.schedule_type as keyof typeof scheduleTypeColors]}`}>
                {scheduleTypeIcons[schedule.schedule_type as keyof typeof scheduleTypeIcons]}
              </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                  
                    <span className="text-sm text-gray-500">Age: {item.age_days} days</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
               
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
          <CardContent className="pt-0 px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">
                  {
                    schedule.schedule_type != 'feeding' ? 
                    "" :
                    "Dosage & Quantity"
                  }
                  </p>
                  <p className="font-medium">
                   {
                    schedule.schedule_type != 'feeding' ?
                  ``
                   :
                   `${item.dose} • ${item.dose} Kg` 
                   }
                  </p>
                </div>
              </div>

             
              {/* { schedule.schedule_type != 'feeding' &&
                 <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-gray-500" />
                 <div>
                   <p className="text-xs text-gray-500">Withdrawal Period</p>
                   <p className="font-medium">{item.withdrawal_period_days} days</p>
                 </div>
                
               </div>
              } */}
               </div>

               { schedule.schedule_type != 'feeding' &&
              <>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Thermometer className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 mb-1">Storage Instructions</p>
                    <p className="text-sm text-amber-700">{item.storage_instructions}</p>
                  </div>
                </div>
              </div>
            
              </>
}

           
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
  )
}

export default ItemView
