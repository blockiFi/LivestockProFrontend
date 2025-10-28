import ScheduleView from "@/components/poultry/Flocks/Schedule/ScheduleView";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NewScheduleForm, PaginatedRequestType } from "@/lib/interfaces";
import { getSchedules } from "@/lib/request";
import type { DetailedSchedule } from "@/lib/types";
import type { RootState } from "@/store";
import { Activity, BarChart3, CheckCircle, Package, Plus, Settings2, Syringe } from "lucide-react"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

// Local fallback for creating schedule items when the shared request module does not export createScheduleItems.
// Replace this implementation with your real API client if available.
const createScheduleItems = async (token: string, scheduleId: number, items: any[]) => {
  try {
    // Attempt a conventional POST to a predictable endpoint; adjust the URL as needed for your backend.
    const res = await fetch(`/api/schedules/${scheduleId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ items })
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message = payload?.message || `HTTP ${res.status}`;
      return { success: false, error: [message] };
    }

    const data = await res.json().catch(() => null);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: [err?.message || "Network error"] };
  }
};

// Local fallback for creating schedules when the shared request module does not export createSchedule.
// Adjust endpoint and payload to match your backend's API.
const createSchedule = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  payload: { name: string; description?: string; poultry_type_id?: number; farm_id?: number }
) => {
  try {
    const res = await fetch(`/api/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({
        ...payload,
        schedule_type: scheduleType,
        farm_id: farmId
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.message || `HTTP ${res.status}`;
      return { success: false, error: [message] };
    }

    const data = await res.json().catch(() => null);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: [err?.message || "Network error"] };
  }
};

import Pagination from "@/components/general/Pagination";
import CreateSchedule from "@/components/modals/CreateSchedule";
import { AlertDialog } from "@/components/ui/alert-dialog";

const ScheduleManagementPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
   const token = useSelector((state: RootState) => state.authentication.token);
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const [activeTab, setActiveTab] = useState("medication");

   const [schedules, setSchedules] = useState<{ 
     medicationSchedules?: PaginatedRequestType<DetailedSchedule[]>, 
     vaccinationSchedules?: PaginatedRequestType<DetailedSchedule[]> 
   }>({});
  const [medicationPage, setMedicationPage] = useState(1);
  const [medicationTotalPages, setMedicationTotalPages] = useState(1);
  const [vaccinationPage, setVaccinationPage] = useState(1);
  const [vaccinationTotalPages, setVaccinationTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info"
  });

  const showAlert = (title: string, description: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertDialog({
      isOpen: true,
      title,
      description,
      type
    });
  };

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleCreateSchedule = async (scheduleData: NewScheduleForm<any>) => {
    if (!token || !farmId) {
      showAlert("Authentication Required", "Please log in to create schedules.", "error");
      return;
    }

    setIsCreating(true);
    try {
      const scheduleResponse = await createSchedule(
        token,
        farmId,
        scheduleData.schedule_type as "medication" | "vaccination",
        {
          name: scheduleData.name,
          description: scheduleData.description,
          poultry_type_id: scheduleData.poultry_type_id,
          farm_id: farmId
        }
      );

      if (!scheduleResponse.success || !scheduleResponse.data) {
        showAlert("Schedule Creation Failed", scheduleResponse.error?.join(", ") || "Unknown error occurred while creating the schedule.", "error");
        setIsCreating(false); // Reset loading state
        return;
      }

      // Then create the schedule items
      if (scheduleData.items.length > 0) {
        const itemsResponse = await createScheduleItems(
          token,
          scheduleResponse.data.id,
          scheduleData.items.map(item => ({
            age_days: item.age_days,
            poultry_vaccine_id: item.vaccine_id,
            poultry_medication_id: item.medication_id,
            name: item.name,
            dose: item.dose || 1,
            withdrawal_period_days: item.withdrawal_period_days || 0,
            storage_instructions: item.storage_instructions || "",
            description: item.description || ""
          }))
        );

        if (!itemsResponse.success) {
          showAlert("Items Creation Failed", `Schedule created but failed to add items: ${itemsResponse.error?.join(", ") || "Unknown error"}`, "error");
          setIsCreating(false); // Reset loading state
          return;
        }
      }

      showAlert("Schedule Created Successfully", `${scheduleData.schedule_type.charAt(0).toUpperCase() + scheduleData.schedule_type.slice(1)} schedule "${scheduleData.name}" has been created successfully.`, "success");
      
      // Close the modal only on success
      setIsCreateModalOpen(false);
      
      // Refresh the schedules
      const fetchSchedules = async () => {
        try {
          const [medicationRes, vaccinationRes] = await Promise.all([
            getSchedules(token, farmId, "medication", true, medicationPage, 10),
            getSchedules(token, farmId, "vaccination", true, vaccinationPage, 10)
          ]);

          const updatedSchedules: typeof schedules = {} as any;

          if ((medicationRes as any).success && (medicationRes as any).data) {
            updatedSchedules.medicationSchedules = medicationRes as any;
            setMedicationTotalPages((medicationRes as any).total_pages || 1);
          }
          if ((vaccinationRes as any).success && (vaccinationRes as any).data) {
            updatedSchedules.vaccinationSchedules = vaccinationRes as any;
            setVaccinationTotalPages((vaccinationRes as any).total_pages || 1);
          }

          setSchedules(prev => ({ ...prev, ...updatedSchedules }));
        } catch (error) {
          console.error("Error refreshing schedules:", error);
        }
      };

      await fetchSchedules();
    } catch (error) {
      console.error("Error creating schedule:", error);
      showAlert("Creation Failed", "Failed to create schedule. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
  }
    useEffect(() => {
     
        const fetchSchedules = async () => {
            if (!token || !farmId) return;
      
            try {
              const [medicationRes, vaccinationRes] = await Promise.all([
                getSchedules(token, farmId, "medication", true, medicationPage, 10),
                getSchedules(token, farmId, "vaccination", true, vaccinationPage, 10)
              ]);
      
              const updatedSchedules: typeof schedules = {} as any;
      
              if ((medicationRes as any).success && (medicationRes as any).data) {
                console.log("Fetched Medication Schedules: ", (medicationRes as any).data);
                updatedSchedules.medicationSchedules = medicationRes as any;
                setMedicationTotalPages((medicationRes as any).total_pages || 1);
              }
              if ((vaccinationRes as any).success && (vaccinationRes as any).data) {
                updatedSchedules.vaccinationSchedules = vaccinationRes as any;
                setVaccinationTotalPages((vaccinationRes as any).total_pages || 1);
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
                    Comprehensive management of medication and vaccination schedules
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
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                    <CheckCircle className="h-8 w-8 text-purple-200" />
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
                    isLoading={isCreating}
                />
    
    <AlertDialog
      isOpen={alertDialog.isOpen}
      onClose={closeAlert}
      title={alertDialog.title}
      description={alertDialog.description}
      type={alertDialog.type}
    />
    </>
  )
}

export default ScheduleManagementPage
