
import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Pill,
  Package,
  Activity,
  CheckCircle,
  AlertTriangle,
  Shield,
  Wheat,
  Plus,
  BarChart3,
  Settings,
  ArrowLeft,
  Lock,
} from "lucide-react"
import type { BatchFeedingSchedule, BatchSchedule } from "@/lib/types"
import FeedingScheduleView from "./FeedingScheduleView"
import MedicationScheduleView from "./MedicationScheduleView"
import VaccinationScheduleView from "./VaccinationScheduleView"
import AssignFeedingScheduleModal from "./AssignFeedingScheduleModal"
import CloseBatchModal from "@/components/modals/CloseBatchModal"
import { listMissedFeedingDays } from "@/lib/feeding-range"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

const BatchScheduleView = ({
  feedingSchedule,
  medicationSchedule,
  vaccinationSchedule,
  flockQuantity,
  flockId,
  flockName,
  flockStatus,
  poultryTypeId,
  poultryTypeName,
  currentAge,
  currentFeedingDay,
  arrivalDate,
  onRefresh,
  onBack,
  onBatchClosed,
}: {
  feedingSchedule: BatchFeedingSchedule[]
  medicationSchedule: BatchSchedule[]
  vaccinationSchedule: BatchSchedule[]
  flockQuantity: number
  flockId: number
  flockName: string
  flockStatus: string
  poultryTypeId?: number | null
  poultryTypeName?: string | null
  currentAge: number
  currentFeedingDay: number
  arrivalDate: string
  onRefresh?: () => void
  onBack?: () => void
  onBatchClosed?: () => void
}) => {

   console.log("Batch Feeding Schedule: ", feedingSchedule);
    console.log("Batch Medication Schedule: ", medicationSchedule);
    console.log("Batch Vaccination Schedule: ", vaccinationSchedule);
    const [activeTab, setActiveTab] = useState<string>("medication");
    const [loading , setLoading] = useState<boolean>(false)
    const [isCloseBatchOpen, setIsCloseBatchOpen] = useState(false)
    const [assignFeedingOpen, setAssignFeedingOpen] = useState(false)
    const token = useSelector((state: RootState) => state.authentication.token)
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
    const isActiveBatch = flockStatus === "active"

    const activeFeedingSchedules = useMemo(
      () =>
        (feedingSchedule || []).filter(
          (s) => String(s.status || "").toLowerCase() !== "cancelled"
        ),
      [feedingSchedule]
    )
    const activeFeeding = activeFeedingSchedules[0] || null
    
    const {totalSchedules, totalActiveSchedules, totalCompletedSchedules, totalOverdueSchedules} = useMemo(() => {
        const totalFeedingSchedule = activeFeeding ? activeFeeding.items.length : 0;
        const totalMedicationSchedules = medicationSchedule.length > 0 ? medicationSchedule[0].items.length : 0;
        const totalVaccinationSchedules = vaccinationSchedule.length > 0 ? vaccinationSchedule[0].items.length : 0;
        const totalSchedules = totalFeedingSchedule + totalVaccinationSchedules + totalMedicationSchedules;

        const activeFeedingItemCount = activeFeeding
          ? activeFeeding.items.filter(item => item.status === "scheduled").length
          : 0;
        const activeMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "scheduled").length
          : 0;
        const activeVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "scheduled").length
          : 0;
        const totalActiveSchedules = activeFeedingItemCount + activeMedicationSchedules + activeVaccinationSchedules;

        const completedFeedingSchedules = activeFeeding
          ? activeFeeding.items.filter(item => item.status === "completed").length
          : 0;
        const completedMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "completed").length
          : 0;
        const completedVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "completed").length
          : 0;
        const totalCompletedSchedules = completedFeedingSchedules + completedMedicationSchedules + completedVaccinationSchedules;

        const overdueFeedingSchedules = activeFeeding
          ? listMissedFeedingDays({
              scheduleItems: activeFeeding.schedule?.items || [],
              executedItems: activeFeeding.items || [],
              currentFeedingDay,
              arrivalDate,
              flockQuantity,
            }).length
          : 0;
        const overdueMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "overdue").length
          : 0;
        const overdueVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "overdue").length
          : 0;
        const totalOverdueSchedules = overdueFeedingSchedules + overdueMedicationSchedules + overdueVaccinationSchedules;
        return { totalSchedules  , totalActiveSchedules , totalCompletedSchedules, totalOverdueSchedules };
    } , [activeFeeding , medicationSchedule , vaccinationSchedule, currentFeedingDay, arrivalDate, flockQuantity])


    // Simulate loading schedules
    useMemo(() => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000); // Simulate a 2 second loading time
    }, []);
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {onBack && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onBack}
                      className="mb-4 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Flock Details
                    </Button>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2"> Schedule Management</h1>
                  <p className="text-gray-600">
                    Comprehensive management of medication, vaccination, and feeding schedules
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isActiveBatch ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                      onClick={() => setIsCloseBatchOpen(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Close Batch
                    </Button>
                  ) : (
                    <Badge variant="outline" className="capitalize px-3 py-1">
                      Batch {flockStatus}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={!isActiveBatch}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Schedule
                  </Button>
                </div>
              </div>
            </div>

{
    loading ?

    <div
    className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300" >
    <div className="h-24 flex items-center justify-center mb-6">
        
        <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping"></div>
            <div
            className="absolute inset-2 rounded-full border-4 border-purple-500/50 animate-ping"
            style={{ animationDelay: "0.2s" }}
            ></div>
            <div
            className="absolute inset-4 rounded-full border-4 border-pink-500/70 animate-ping"
            style={{ animationDelay: "0.4s" }}
            >
         </div>
        </div>
         </div>
         </div>
    <h3 className="text-lg font-semibold text-gray-800 text-center">loading schedules</h3>
  </div>
             :

<>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Schedules</p>
                      <p className="text-2xl font-bold">{totalSchedules}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Schedules</p>
                      <p className="text-2xl font-bold">{totalActiveSchedules}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Completed</p>
                      <p className="text-2xl font-bold">{totalCompletedSchedules}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Overdue Items</p>
                      <p className="text-2xl font-bold">{totalOverdueSchedules}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
  
            {/* Schedule Type Tabs */}
            <Card className="mb-6 border-0 shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="medication" className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medication ({medicationSchedule.length > 0 ? medicationSchedule[0].schedule.items.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="vaccination" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Vaccination ({vaccinationSchedule.length > 0 ? vaccinationSchedule[0].schedule.items.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="feeding" className="flex items-center gap-2">
                      <Wheat className="h-4 w-4" />
                      Feeding ({activeFeeding ? activeFeeding.schedule?.items?.length || 0 : 0})
                    </TabsTrigger>
                  </TabsList>
                
                <TabsContent value="medication" className="mt-6">
                  {medicationSchedule && medicationSchedule.length > 0 ? (
                    <MedicationScheduleView schedule={medicationSchedule[0]} currentAge={currentAge} onRefresh={onRefresh} readOnly={!isActiveBatch} />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Pill className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium">No medication schedules available</p>
                      <p className="text-sm mt-1">Create a medication schedule to start tracking treatments</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="vaccination" className="mt-6">
                  {vaccinationSchedule && vaccinationSchedule.length > 0 ? (
                    <VaccinationScheduleView schedule={vaccinationSchedule[0]} currentAge={currentAge} onRefresh={onRefresh} readOnly={!isActiveBatch} />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium">No vaccination schedules available</p>
                      <p className="text-sm mt-1">Create a vaccination schedule to protect your flock</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="feeding" className="mt-6">
                  {activeFeeding ? (
                    <FeedingScheduleView
                      schedule={activeFeeding}
                      flockQuantity={flockQuantity}
                      currentFeedingDay={currentFeedingDay}
                      arrivalDate={arrivalDate}
                      onRefresh={onRefresh}
                      readOnly={!isActiveBatch}
                      onChangeSchedule={
                        isActiveBatch ? () => setAssignFeedingOpen(true) : undefined
                      }
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Wheat className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium">No feeding schedules available</p>
                      <p className="text-sm mt-1">
                        Assign an existing feeding program to this flock to manage feed distribution
                      </p>
                      {isActiveBatch && (
                        <Button
                          className="mt-4"
                          onClick={() => setAssignFeedingOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Assign Feeding Schedule
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            
  

</>

    
}
           
            {/* Summary Cards */}
          
          </div>
 </div>

      {farmId && token && (
        <CloseBatchModal
          open={isCloseBatchOpen}
          onOpenChange={setIsCloseBatchOpen}
          token={token}
          farmId={farmId}
          flockId={flockId}
          flockName={flockName}
          liveBirdCount={flockQuantity}
          onSuccess={() => {
            onBatchClosed?.()
            onRefresh?.()
          }}
        />
      )}
      {farmId && token && (
        <AssignFeedingScheduleModal
          open={assignFeedingOpen}
          onOpenChange={setAssignFeedingOpen}
          token={token}
          farmId={farmId}
          flockId={flockId}
          poultryTypeId={poultryTypeId}
          poultryTypeName={poultryTypeName}
          currentFeedingScheduleId={activeFeeding?.feeding_schedule_id}
          onAssigned={() => onRefresh?.()}
        />
      )}
      </TooltipProvider>
    )
  }
export default BatchScheduleView;
