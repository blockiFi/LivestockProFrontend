import ScheduleView from "@/components/poultry/Flocks/Schedule/ScheduleView";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NewScheduleForm, PaginatedRequestType } from "@/lib/interfaces";
import { getSchedules } from "@/lib/request";
import type { DetailedSchedule } from "@/lib/types";
import type { RootState } from "@/store";
import { Activity, BarChart3, CheckCircle, Package, Plus, Settings2, Syringe, WheatIcon } from "lucide-react"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Pagination from "@/components/general/Pagination";
import CreateSchedule from "@/components/modals/CreateSchedule";

const ScheduleManagementPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
   const token = useSelector((state: RootState) => state.authentication.token);
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const [activeTab, setActiveTab] = useState("medication");

   const [schedules, setSchedules] = useState<{ 
     medicationSchedules?: PaginatedRequestType<DetailedSchedule[]>, 
     vaccinationSchedules?: PaginatedRequestType<DetailedSchedule[]>, 
     feedingSchedules?: PaginatedRequestType<DetailedSchedule[]> 
   }>({});
   const [medicationPage, setMedicationPage] = useState(1);
   const [medicationTotalPages, setMedicationTotalPages] = useState(1);
   const [vaccinationPage, setVaccinationPage] = useState(1);
   const [vaccinationTotalPages, setVaccinationTotalPages] = useState(1);
   const handleCreateSchedule = (scheduleData: NewScheduleForm<any>) => {
    console.log("Creating new schedule:", scheduleData)
    // Implementation would send data to backend
    // For now, we'll just log it and show a success message
    alert(`Successfully created ${scheduleData.schedule_type} schedule: ${scheduleData.name}`)
  }
    useEffect(() => {
     
        const fetchSchedules = async () => {
            if (!token || !farmId) return;
      
            try {
              const [medicationRes, vaccinationRes] = await Promise.all([
                getSchedules(token, farmId, "medication", true, medicationPage, 10),
                getSchedules(token, farmId, "vaccination", true, vaccinationPage, 10),
              ]);
      
              const updatedSchedules: typeof schedules = {};
      
              if (medicationRes.success && medicationRes.data) {
                console.log("Fetched Medication Schedules: ", medicationRes.data);
                updatedSchedules.medicationSchedules = medicationRes;
                setMedicationTotalPages(medicationRes.total_pages || 1);
              }
              if (vaccinationRes.success && vaccinationRes.data) {
                updatedSchedules.vaccinationSchedules = vaccinationRes;
                setVaccinationTotalPages(vaccinationRes.total_pages || 1);
              }
      
              setSchedules(prev => ({ ...prev, ...updatedSchedules }));
            } catch (error) {
              console.error("Error fetching schedules:", error);
            }
          };
      
          fetchSchedules();
    }, [token, farmId, medicationPage, vaccinationPage]);
  return (
    <>
     
    <div className="flex flex-col w-full gap-6 ">
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
                    <Settings2 className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
                
             </div>
              </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
       <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Schedules</p>
                      <p className="text-2xl font-bold">
                        {(schedules.medicationSchedules?.data?.length ?? 0) +
                        (schedules.vaccinationSchedules?.data?.length ?? 0)}
                        </p>
                    </div>
                    <Package className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Medication Schedules</p>
                      <p className="text-2xl font-bold">{(schedules.medicationSchedules?.data?.length ?? 0)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Vacination Schedules</p>
                      <p className="text-2xl font-bold">{(schedules.vaccinationSchedules?.data?.length ?? 0)}</p>
                    </div>
                    <Syringe className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
  
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Feeding Schedules</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <WheatIcon className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
       </div>

       <Card className="mb-6 border-0 shadow-sm">

       <CardContent className="p-6">

             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="medication" className="flex items-center gap-2">      
              <Syringe className="h-4 w-4" />
              Medication
            </TabsTrigger>
            <TabsTrigger value="vaccination" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Vaccination
            </TabsTrigger>
          </TabsList>

                  {/* <div className="flex flex-col md:flex-row gap-4">
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
  
                  </div> */}
               <TabsContent value="medication" className="mt-0">
                {(!schedules.medicationSchedules || (schedules.medicationSchedules.data?.length ?? 0) === 0) ? (
                    <div className="text-center text-gray-500 py-6">
                    No Medication Schedules.
                    </div>
                ) : (
                    <>
                      {(schedules.medicationSchedules.data ?? []).map((schedule: any, index: number) => (
                        <ScheduleView key={index} type="medication" schedule={schedule} />
                      ))}
                      {medicationTotalPages > 1 && (
                        <Pagination
                          currentPage={medicationPage}
                          totalPages={medicationTotalPages}
                          onPageChange={setMedicationPage}
                        />
                      )}
                    </>
                )}
                </TabsContent>
                <TabsContent value="vaccination" className="mt-0">
  {(!schedules.vaccinationSchedules || (schedules.vaccinationSchedules.data?.length ?? 0) === 0) ? (
    <div className="text-center text-gray-500 py-6">
      No Vaccination Schedules.
    </div>
  ) : (
    <>
      {(schedules.vaccinationSchedules.data ?? []).map((schedule: any, index: number) => (
        <ScheduleView key={index} type="vaccination" schedule={schedule} />
      ))}
      {vaccinationTotalPages > 1 && (
        <Pagination
          currentPage={vaccinationPage}
          totalPages={vaccinationTotalPages}
          onPageChange={setVaccinationPage}
        />
      )}
    </>
  )}
</TabsContent>

             </Tabs>

        </CardContent>
       </Card>
     
    </div>
    <CreateSchedule
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateSchedule}
                />
    </>
  )
}

export default ScheduleManagementPage
