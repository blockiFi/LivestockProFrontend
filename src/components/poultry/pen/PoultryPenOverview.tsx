import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PoultryHouse } from "@/lib/types"
import { formatDate, houseStatusColors } from "@/lib/utils"
import { ChevronDown, ChevronUp, Home } from "lucide-react"
import { useState } from "react"
const PoultryPenOverview = ({ house  , quantity = 0}: { house: PoultryHouse  , quantity : number}) => {
  const [displayHouseDetails, setDisplayHouseDetails] = useState(false);
  const utilizationPercentage = Math.round((quantity / house.capacity) * 100)
  const handleDisplayView = () => {
    setDisplayHouseDetails(!displayHouseDetails);
  }
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="w-full flex items-center justify-between">
         
            <div className="flex items-center  gap-2">
               <Home className="h-5 w-5" />
                   House Details  
             </div>
             <div >
              {
                displayHouseDetails ? (
                  <ChevronUp onClick={handleDisplayView}/>
                ) : (
                 <ChevronDown onClick={handleDisplayView} /> 
                )
              }
             
            
              </div>
         
        </CardTitle>
      </CardHeader>

      <CardContent className={`${displayHouseDetails ? "block" : "hidden"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">House Name</p>
            <p className="font-semibold text-lg">{house.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Litter Type</p>
            <p className="font-semibold">{house.liter_type_id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Capacity Utilization</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {quantity.toLocaleString()} / {house.capacity.toLocaleString()}
                </span>
                <span className="font-medium">{utilizationPercentage}%</span>
              </div>
              <Progress value={utilizationPercentage} className="h-2 " />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge className={`${houseStatusColors[house.status.charAt(0).toUpperCase() + house.status.slice(1) as keyof typeof houseStatusColors]} font-medium`}>
              {house.status.charAt(0).toUpperCase() + house.status.slice(1)}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Construction Date</p>
            <p className="font-semibold">{formatDate(house.construction_date)}</p>
          </div>

          {house.notes && (
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <p className="text-sm text-gray-700 truncate cursor-help">{house.notes}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{house.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PoultryPenOverview
