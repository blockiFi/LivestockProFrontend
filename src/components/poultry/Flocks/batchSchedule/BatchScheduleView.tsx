
import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Pill,
  User,
  DollarSign,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Check,
  Edit,
  Trash2,
  AlertCircle,
  Syringe,
  FileText,
  Thermometer,
  Activity,
  CheckCircle,
  AlertTriangle,
  Shield,
  Wheat,
  Plus,
  BarChart3,
  Settings,
} from "lucide-react"
import type { BatchFeedingSchedule, BatchSchedule } from "@/lib/types"
import ScheduleView from "./ScheduleView"

const BatchScheduleView = ({feedingSchedule , medicationSchedule , vaccinationSchedule } : {feedingSchedule : BatchFeedingSchedule[] , medicationSchedule : BatchSchedule[] , vaccinationSchedule : BatchSchedule[]}) => {

   console.log("Batch Feeding Schedule: ", feedingSchedule);
    console.log("Batch Medication Schedule: ", medicationSchedule);
    console.log("Batch Vaccination Schedule: ", vaccinationSchedule);
    const [activeTab, setActiveTab] = useState<string>("medication");
    const [isExpanded , setIsExpanded] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date");
    const [loading , setLoading] = useState<boolean>(false)
    
    const loadSchedules = async () =>  {
        
    }
    const {totalSchedules, totalActiveSchedules, totalCompletedSchedules, totalOverdueSchedules} = useMemo(() => {
        const totalFeedingSchedule = feedingSchedule.length > 0 ? feedingSchedule[0].items.length : 0;
        const totalMedicationSchedules = medicationSchedule.length > 0 ? medicationSchedule[0].items.length : 0;
        const totalVaccinationSchedules = vaccinationSchedule.length > 0 ? vaccinationSchedule[0].items.length : 0;
        const totalSchedules = totalFeedingSchedule + totalVaccinationSchedules + totalMedicationSchedules;

        // Calculate the total number of active schedules (status === "active")
        const activeFeedingSchedules = feedingSchedule.length > 0
          ? feedingSchedule[0].items.filter(item => item.status === "scheduled").length
          : 0;
        const activeMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "scheduled").length
          : 0;
        const activeVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "scheduled").length
          : 0;
        const totalActiveSchedules = activeFeedingSchedules + activeMedicationSchedules + activeVaccinationSchedules;

        // Calculate the total number of completed schedules (status === "completed")
        const completedFeedingSchedules = feedingSchedule.length > 0
          ? feedingSchedule[0].items.filter(item => item.status === "completed").length
          : 0;
        const completedMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "completed").length
          : 0;
        const completedVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "completed").length
          : 0;
        const totalCompletedSchedules = completedFeedingSchedules + completedMedicationSchedules + completedVaccinationSchedules;

        // Calculate the total number of overdue schedules (status === "overdue")
        const overdueFeedingSchedules = feedingSchedule.length > 0
          ? feedingSchedule[0].items.filter(item => item.status === "overdue").length
          : 0;
        const overdueMedicationSchedules = medicationSchedule.length > 0
          ? medicationSchedule[0].items.filter(item => item.status === "overdue").length
          : 0;
        const overdueVaccinationSchedules = vaccinationSchedule.length > 0
          ? vaccinationSchedule[0].items.filter(item => item.status === "overdue").length
          : 0;
        const totalOverdueSchedules = overdueFeedingSchedules + overdueMedicationSchedules + overdueVaccinationSchedules;
        return { totalSchedules  , totalActiveSchedules , totalCompletedSchedules, totalOverdueSchedules };
    } , [feedingSchedule , medicationSchedule , vaccinationSchedule])


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
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2"> Schedule Management</h1>
                  <p className="text-gray-600">
                    Comprehensive management of medication, vaccination, and feeding schedules
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                   
                    <TabsTrigger value="medication" className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medication ({medicationSchedule.length > 0 ? medicationSchedule[0].items.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="vaccination" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Vaccination ({vaccinationSchedule.length > 0 ? vaccinationSchedule[0].items.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="feeding" className="flex items-center gap-2">
                      <Wheat className="h-4 w-4" />
                      Feeding ({feedingSchedule.length > 0 ? feedingSchedule[0].items.length : 0})
                    </TabsTrigger>
                  </TabsList>
  
                  {/* Filters and Search */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                        Search Schedules
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="search"
                          placeholder="Search by schedule name or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                        />
                      </div>
                    </div>
  
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[140px] border-gray-200">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
  
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[140px] border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Last Updated</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                
                <TabsContent value="medication" className="mt-0">
                  <ScheduleView schedule={medicationSchedule[0]} />
                </TabsContent>
                <TabsContent value="vaccination" className="mt-0">
                  <ScheduleView schedule={vaccinationSchedule[0]} />
                </TabsContent>

                <TabsContent value="feeding" className="mt-0">
                  <ScheduleView
  schedule={{
    ...feedingSchedule[0],
    farm_id: feedingSchedule[0].flock_id, // or the correct farm_id if available
    schedule_id: feedingSchedule[0].feeding_schedule_id,
    schedule: {
      id: feedingSchedule[0].schedule.id,
      schedule_type: "feeding",
      poultry_type_id: 0, // fallback to 0 if nopresent
      type: "Feeding",
      farm_id: 0,
      name: feedingSchedule[0].schedule.title,
      description: feedingSchedule[0].schedule.description,
      created_at: feedingSchedule[0].schedule.created_at,
      updated_at: feedingSchedule[0].schedule.updated_at,
    },
    items: feedingSchedule[0].items.map(item => ({
      ...item,
      batch_schedule_id: item.feeding_batch_schedule_id,
      schedule_item_id: item.feeding_schedule_item_id,
      scheduled_date: item.feeding_date,
      actual_date: item.feeding_date,
      administered_by: null,
      poultry_vaccine_product_id: null,
      vaccine_product_batch_id: null,
      poultry_medication_id: null,
      dosage: 0,
      quantity: 0,
      cost: 0,
      administration_method_id: 0,
      age_days: 0,
      withdrawal_period_days: 0,
      poultry_vaccine_id: null,
      poultry_medication_id2: null,
      notes: "",
      status: item.status || "scheduled",
      schedule_item: {
        // Map all required ScheduleItem fields, using item.schedule_item and defaults
        id: item.schedule_item.id,
        schedule_id: 0,
        age_days: item.schedule_item.feeding_day,
        poultry_vaccine_id: null,
        poultry_medication_id: null,
        name: `Feed for day : ${item.schedule_item.feeding_day}`,
        dose: item.schedule_item.quantity,
        dose_unit: "", // <-- Add this line
        withdrawal_period_days: 0,
        storage_instructions: "",
        description: "",
        created_at: "",
        updated_at: "",
        // Add any other required fields with defaults
      }
    })),
    status: feedingSchedule[0].status,
  }} />
                </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            
  

</>

    
}
           
            {/* Summary Cards */}
          
          </div>
 </div>
      </TooltipProvider>
    )
  }
export default BatchScheduleView;
