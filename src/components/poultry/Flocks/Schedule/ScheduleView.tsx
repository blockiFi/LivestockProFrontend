import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Clock, Pill, Shield, Wheat } from "lucide-react";
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
                <CardTitle className="text-xl font-bold text-gray-900">name</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Type:{ type}
                  
                  • Flock #34
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
            <p className="text-sm text-gray-700 mb-3">description</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">
                 date
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">date</p>
              </div>
             
             
            </div>
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
                                No  Schedules for  {schedule?.name}.
                              </div>
                            );
                          }
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
