import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BatchSchedule } from "@/lib/types"
import { formatCurrency, formatDate, Naira } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Pill, Shield, Wheat } from "lucide-react"
import ItemView from "./ItemView"
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

const ScheduleView = ({ schedule } :  { schedule: BatchSchedule}) => {
  const completedCount = schedule.items.filter(item => item.status === 'completed').length;
  const percentageCompleted = Math.round((completedCount / schedule.items.length) * 100);
  return (
    <div className="w-full flex flex-col items-center mt-10">
       <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30 w-full min-w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
               <div className={`p-2 rounded-lg ${scheduleTypeColors[schedule.schedule.schedule_type as keyof typeof scheduleTypeColors]}`}>
                {scheduleTypeIcons[schedule.schedule.schedule_type as keyof typeof scheduleTypeIcons]}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">{schedule.schedule.name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Type:{" "}
                  {schedule.schedule.schedule_type.charAt(0).toUpperCase() +
                    schedule.schedule.schedule_type.slice(1)}{" "}
                  • Flock #{schedule.flock_id}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">description</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">
                  {formatDate(schedule.created_at)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(schedule.updated_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Progress</p>
                <p className="font-medium">
                  {percentageCompleted}% completed
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total Cost</p> 
                <p className="font-medium">
                 {`${Naira} ${formatCurrency(schedule.items.reduce((acc, item) => acc + (item.cost || 0), 0))}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
          <Badge className={`${statusColors[schedule.status as keyof typeof statusColors]} font-medium text-xs`}>
                                <span className="ml-1">{schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}</span>
                              </Badge>
           
              <Badge className="bg-red-100 text-red-800 border-red-200 font-medium px-2 py-1 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {schedule.items.reduce((acc , item ) => acc + (item.status === 'overdue' ? 1 : 0), 0)} Overdue
              </Badge>
            
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Schedule Progress</span>
            <span className="font-medium">{percentageCompleted}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentageCompleted}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled {schedule.items.reduce((acc , item ) => acc + (item.status === 'scheduled' ? 1 : 0), 0)}
            </TabsTrigger>
            <TabsTrigger value="administered" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed {schedule.items.reduce((acc , item ) => acc + (item.status === 'completed' ? 1 : 0), 0)}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue {schedule.items.reduce((acc , item ) => acc + (item.status === 'overdue' ? 1 : 0), 0)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="mt-0">
          <div className="space-y-4 w-full min-w-full">
            <Card
                    className={`transition-all duration-200 hover:shadow-md border-gray-200 w-full min-w-full mb-4`}
                    >
                    {
                        (() => {
                          const scheduledItems = schedule.items.filter(item => item.status === 'scheduled');
                          if (scheduledItems.length === 0) {
                            return (
                              <div className="text-center text-gray-500 py-6">No scheduled items.</div>
                            );
                          }
                          return scheduledItems.map((item, index) => (
                            <div className="" key={index}>
                              <ItemView schedule={schedule} item={item} />
                              <div className="border-b border-gray-200 my-2"></div>
                            </div>
                          ));
                        })()}


                        
            </Card>
        </div>
     </TabsContent>

          <TabsContent value="administered" className="mt-0">
           <div className="space-y-4 w-full min-w-full">
            <Card
                    className={`transition-all duration-200 hover:shadow-md border-gray-200 w-full min-w-full mb-4`}
                    >
                    {
                        (() => {
                          const completedItems = schedule.items.filter(item => item.status === 'completed');
                          if (completedItems.length === 0) {
                            return (
                              <div className="text-center text-gray-500 py-6">No completed items.</div>
                            );
                          }
                          return completedItems.map((item, index) => (
                            <div className="" key={index}>
                              <ItemView schedule={schedule} item={item} />
                              <div className="border-b border-gray-200 my-2"></div>
                            </div>
                          ));
                        })()
                        }


                        
            </Card>
        </div>
          </TabsContent>

          <TabsContent value="overdue" className="mt-0">
          <div className="space-y-4 w-full min-w-full">
            <Card
                    className={`transition-all duration-200 hover:shadow-md border-gray-200 w-full min-w-full mb-4`}
                    >
                    {
                        (() => {
                          const overdueItems = schedule.items.filter(item => item.status === 'overdue');
                          if (overdueItems.length === 0) {
                            return (
                              <div className="text-center text-gray-500 py-6">No overdue items.</div>
                            );
                          }
                          return overdueItems.map((item, index) => (
                            <div className="" key={index}>
                              <ItemView schedule={schedule} item={item} />
                              <div className="border-b border-gray-200 my-2"></div>
                            </div>
                          ));
                        })()
                 }
            </Card>
        </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  )
}

export default ScheduleView
