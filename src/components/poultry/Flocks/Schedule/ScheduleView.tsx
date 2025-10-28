import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Clock, Pill, Shield, Syringe, Wheat } from "lucide-react";
import ItemView from "./ItemView";
import { useEffect, useMemo, useState } from "react";
import { getSchedules } from "@/lib/request";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { DetailedSchedule } from "@/lib/types";
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
const statusColors = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const ScheduleView = ({type, schedule} : {type: string, schedule: any | undefined}) => {
   
    const [expand , SetExpand] = useState(false);

    const displayName = schedule?.name ?? schedule?.title ?? "Untitled";

    console.log("Schedule : ",  schedule);
  return (
    <div className="w-full flex flex-col items-center mt-10">
       <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30 w-full min-w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-center" >
            <div className="flex items-center gap-3 mb-2">
               <div className={`p-2 rounded-lg ${scheduleTypeColors[ type as keyof typeof scheduleTypeColors]}`}>
                {scheduleTypeIcons[ type as keyof typeof scheduleTypeIcons]}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">{displayName}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Type:{ type}
                  
               
                </p>
              </div>
            </div>
            <div>
               {
                expand  ? 
                <ChevronUp onClick={() => {
                    SetExpand(false);
                }} /> :
                <ChevronDown onClick={() => {
                    SetExpand(true);
                }}/>
               }
              
            </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{schedule?.description}</p>
          </div>

          
        </div>

        
      </CardHeader>
  {
    expand &&
 
      <CardContent>
        <div className="space-y-4 w-full min-w-full">
            <Card
                    className={`transition-all duration-200 hover:shadow-md border-gray-200 w-full min-w-full mb-4`}
                    >
                    {
                        (() => {
                         
                          if (!schedule?.items || schedule.items.length === 0) {
                            return (
                              <div className="text-center text-gray-500 py-6">
                                No  Schedules for  {displayName}.
                              </div>
                            );
                          }

                          if (type === 'feeding') {
                            return schedule.items.map((item: any, index: number) => (
                              <div className="py-2 px-10" key={index} >
                                <div className="flex items-center justify-between ">
                                   
                                   <div className=" font-medium text-gray-800 ">
                                    {item.feed_type?.name || item.feedType?.name || `Feed Type #${item.feed_type_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600">Day {item.feeding_day ?? index + 1}</div>
                                </div>
                                <div className="text-sm text-gray-600">Total Qty: {Number(item.quantity) || 0} g</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {
                                    (() => {
                                      const totalQty = Number(item.quantity) || 0;
                                      const times = (item.feeding_times || []).map((t: any) => {
                                        const pct = Number(t.percentage) || 0;
                                        const grams = (totalQty * pct) / 100;
                                        return `${t.time} (${pct}% • ${grams}g)`;
                                      }).join(', ');
                                      return <>Times: {times}</>;
                                    })()
                                  }
                                </div>
                                <div className="border-b border-gray-200 my-2"></div>
                              </div>
                            ));
                          }

                          // medication / vaccination items
                          return schedule.items.map((item: any, index: number) => (
                            <div className="" key={index}>
                              <ItemView schedule={schedule} item={item} />
                              <div className="border-b border-gray-200 my-2"></div>
                            </div>
                          ));
                        })()
                        }
           
            </Card>
        </div>
      </CardContent>

}
    </Card>
    </div>
  )
}

export default ScheduleView
