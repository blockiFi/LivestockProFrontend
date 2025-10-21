import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { TooltipProvider } from "@/components/ui/tooltip"
import {
  
  Scale,
  Egg,
  Heart,
  ChevronRight,
  Pill,
  Wheat,
  Activity,
  Shield,
  Plus,
} from "lucide-react"
import { useLoaderData } from "react-router-dom"
import type { DetailedFlockRecord, FeedInventoryType, FeedType, PoultryFeedUsageRecord } from "@/lib/types"
import FlockOverview from "@/components/poultry/Flocks/FlockOverview"
import PoultryPenOverview from "@/components/poultry/pen/PoultryPenOverview"
import DailyRecord from "@/components/poultry/Flocks/DailyRecord"
import MortalityReportPage from "@/components/poultry/Flocks/MortalityReport"
import WeightReportPage from "@/components/poultry/Flocks/WeightReportPage"
import EggRecordPage from "@/components/poultry/Flocks/EggRecordPage"
import FeedUsageView from "@/components/poultry/Flocks/FeedUsageView"
import MedicationRecordView from "@/components/poultry/Flocks/MedicationRecordView"
import VaccinationRecordView from "@/components/poultry/Flocks/VaccinationRecordView"
import { Button } from "@/components/ui/button"
import { NotificationSystem } from "@/components/poultry/Flocks/Notification"
import { useState, useEffect } from "react"
import BatchScheduleView from "@/components/poultry/Flocks/batchSchedule/BatchScheduleView"
import AddDailyRecordModal from "@/components/modals/AddDailyRecordModal"
import { createDailyRecord, createMortalityRecord, createWeightReport, deleteWeightReport, createFeedUsageRecord, deleteFeedUsageRecord, getFeedInventories, getFeedTypes, createVaccinationRecord, deleteVaccinationRecord, getVaccines, getVaccineInventories, getAdministrationMethods } from "@/lib/request"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
const FlockPage = () => {
    const {Flock: initialFlock} = useLoaderData() as {Flock: DetailedFlockRecord};
    const [flock, setFlock] = useState<DetailedFlockRecord>(initialFlock);
    const [view, setView] = useState<"metrics" | "schedule" >("metrics");
    const [isAddDailyRecordModalOpen, setIsAddDailyRecordModalOpen] = useState(false);
    const [feedInventories, setFeedInventories] = useState<FeedInventoryType[]>([]);
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
    const [vaccines, setVaccines] = useState<any[]>([]);
    const [vaccineInventories, setVaccineInventories] = useState<any[]>([]);
    const [administrationMethods, setAdministrationMethods] = useState<any[]>([]);
    
    const token = useSelector((state: RootState) => state.authentication.token);
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);

    // Fetch feed inventories, feed types, vaccines, vaccine inventories, and administration methods
    useEffect(() => {
        const fetchData = async () => {
            if (!farmId || !token) return;
            
            try {
                const [
                    inventoriesResponse, 
                    typesResponse, 
                    vaccinesResponse, 
                    vaccineInventoriesResponse, 
                    administrationMethodsResponse
                ] = await Promise.all([
                    getFeedInventories(token, farmId),
                    getFeedTypes(token, farmId, flock.poultry_type_id),
                    getVaccines(token, farmId),
                    getVaccineInventories(token, farmId),
                    getAdministrationMethods(token, farmId)
                ]);
                
                if (inventoriesResponse.success && Array.isArray(inventoriesResponse.data)) {
                    setFeedInventories(inventoriesResponse.data);
                } else {
                    setFeedInventories([]);
                }
                
                if (typesResponse.success && Array.isArray(typesResponse.data)) {
                    setFeedTypes(typesResponse.data);
                } else {
                    setFeedTypes([]);
                }

                if (vaccinesResponse.success && Array.isArray(vaccinesResponse.data)) {
                    setVaccines(vaccinesResponse.data);
                } else {
                    setVaccines([]);
                }

                if (vaccineInventoriesResponse.success && Array.isArray(vaccineInventoriesResponse.data)) {
                    setVaccineInventories(vaccineInventoriesResponse.data);
                } else {
                    setVaccineInventories([]);
                }

                if (administrationMethodsResponse.success && Array.isArray(administrationMethodsResponse.data)) {
                    setAdministrationMethods(administrationMethodsResponse.data);
                } else {
                    setAdministrationMethods([]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        
        fetchData();
    }, [farmId, token]);

    const handleCreateDailyRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createDailyRecord(token, farmId, flock.id, recordData);
            if (response.success) {
                console.log("Daily record created successfully:", response.data);
                toast.success("Daily record created successfully!");
                setIsAddDailyRecordModalOpen(false);
                
                // Update the local flock state with the new daily record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    daily_records: [...prevFlock.daily_records, response.data]
                }));
            } else {
                console.error("Failed to create daily record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating daily record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the daily record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleCreateMortalityRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createMortalityRecord(token, recordData);
            if (response.success) {
                console.log("Mortality record created successfully:", response.data);
                toast.success("Mortality record created successfully!");
                
                // Update the local flock state with the new mortality record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    mortality_reports: [...prevFlock.mortality_reports, response.data!]
                }));
            } else {
                console.error("Failed to create mortality record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating mortality record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the mortality record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    // const handleDeleteMortalityRecord = async (recordId: number) => {
    //     if (!farmId || !token) return;
        
    //     try {
    //         const response = await deleteMortalityRecord(token, farmId, recordId);
    //         if (response.success) {
    //             console.log("Mortality record deleted successfully");
    //             toast.success("Mortality record deleted successfully!");
                
    //             // Update the local flock state by removing the deleted record
    //             setFlock(prevFlock => ({
    //                 ...prevFlock,
    //                 mortality_reports: prevFlock.mortality_reports.filter(report => report.id !== recordId)
    //             }));
    //         } else {
    //             console.error("Failed to delete mortality record:", response);
    //             let errorMessage = "Unknown error occurred";
                
    //             if (response.error && Array.isArray(response.error) && response.error.length > 0) {
    //                 errorMessage = response.error.join(", ");
    //             } else if (response.error) {
    //                 errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
    //             }
                
    //             toast.error(errorMessage);
    //             throw new Error(errorMessage);
    //         }
    //     } catch (error) {
    //         console.error("Error deleting mortality record:", error);
    //         if (error instanceof Error && error.message !== "Unknown error occurred") {
    //             throw error;
    //         } else {
    //             toast.error("An error occurred while deleting the mortality record. Please try again.");
    //             throw new Error("Network or unexpected error occurred");
    //         }
    //     }
    // };

    const handleCreateWeightReport = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createWeightReport(token, farmId, recordData);
            if (response.success) {
                console.log("Weight report created successfully:", response.data);
                toast.success("Weight report created successfully!");
                
                // Update the local flock state with the new weight report
                setFlock(prevFlock => ({
                    ...prevFlock,
                    weight_reports: [...prevFlock.weight_reports, response.data!]
                }));
            } else {
                console.error("Failed to create weight report:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating weight report:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the weight report. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleDeleteWeightReport = async (recordId: number) => {
        if (!farmId || !token) return;
        
        try {
            const response = await deleteWeightReport(token, farmId, recordId);
            if (response.success) {
                console.log("Weight report deleted successfully");
                toast.success("Weight report deleted successfully!");
                
                // Update the local flock state by removing the deleted record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    weight_reports: prevFlock.weight_reports.filter(report => report.id !== recordId)
                }));
            } else {
                console.error("Failed to delete weight report:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting weight report:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while deleting the weight report. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleCreateFeedUsageRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createFeedUsageRecord(token, farmId, recordData);
            if (response.success) {
                console.log("Feed usage record created successfully:", response.data);
                toast.success("Feed usage record created successfully!");
                
                // Enrich the new record with full feed_inventory and feed_type objects
                const newRecord = response.data!;
                console.log("New record from API:", newRecord);
                console.log("Quantity type:", typeof newRecord.quantity, "Value:", newRecord.quantity);
                console.log("Unit cost type:", typeof newRecord.unit_cost, "Value:", newRecord.unit_cost);
                
                const feedInventory = feedInventories.find(inv => inv.id === newRecord.poultry_feed_inventory_id);
                const feedType = feedTypes.find(type => type.id === newRecord.poultry_feed_type_id);
                
                // Only add the record if we have both feed_inventory and feed_type data
                if (feedInventory && feedType) {
                    const enrichedRecord: PoultryFeedUsageRecord = {
                        ...newRecord,
                        // Ensure numeric fields are properly converted
                        quantity: newRecord.quantity != null ? (typeof newRecord.quantity === 'string' ? parseFloat(newRecord.quantity) || 0 : newRecord.quantity) : 0,
                        unit_cost: newRecord.unit_cost != null ? (typeof newRecord.unit_cost === 'string' ? parseFloat(newRecord.unit_cost) || 0 : newRecord.unit_cost) : 0,
                        feed_inventory: feedInventory,
                        feed_type: feedType
                    };
                    
                    console.log("Enriched record:", enrichedRecord);
                    console.log("Final quantity:", enrichedRecord.quantity, "type:", typeof enrichedRecord.quantity);
                    console.log("Final unit_cost:", enrichedRecord.unit_cost, "type:", typeof enrichedRecord.unit_cost);
                    
                    // Update the local flock state with the enriched feed usage record
                    setFlock(prevFlock => ({
                        ...prevFlock,
                        poultry_feed_usages: [...prevFlock.poultry_feed_usages, enrichedRecord]
                    }));
                } else {
                    console.warn("Could not find feed inventory or feed type for the new record, record not added to local state. Page refresh may be required.");
                    // Optionally, you could fetch the updated flock data here
                }
            } else {
                console.error("Failed to create feed usage record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating feed usage record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the feed usage record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleDeleteFeedUsageRecord = async (recordId: number) => {
        if (!farmId || !token) return;
        
        try {
            const response = await deleteFeedUsageRecord(token, farmId, recordId);
            if (response.success) {
                console.log("Feed usage record deleted successfully");
                toast.success("Feed usage record deleted successfully!");
                
                // Update the local flock state by removing the deleted record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_feed_usages: prevFlock.poultry_feed_usages.filter(record => record.id !== recordId)
                }));
            } else {
                console.error("Failed to delete feed usage record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting feed usage record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while deleting the feed usage record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleCreateVaccinationRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createVaccinationRecord(token, farmId, recordData);
            if (response.success) {
                console.log("Vaccination record created successfully:", response.data);
                toast.success("Vaccination record created successfully!");
                
                // Update the local flock state with the new vaccination record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_vaccination_records: [...prevFlock.poultry_vaccination_records, response.data]
                }));
            } else {
                console.error("Failed to create vaccination record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating vaccination record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the vaccination record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleDeleteVaccinationRecord = async (recordId: number) => {
        if (!farmId || !token) return;
        
        try {
            const response = await deleteVaccinationRecord(token, farmId, recordId);
            if (response.success) {
                console.log("Vaccination record deleted successfully");
                toast.success("Vaccination record deleted successfully! Inventory has been restored.");
                
                // Update the local flock state by removing the deleted vaccination record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_vaccination_records: prevFlock.poultry_vaccination_records.filter(record => record.id !== recordId)
                }));
            } else {
                console.error("Failed to delete vaccination record:", response);
                let errorMessage = "Unknown error occurred";
                
                if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                } else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting vaccination record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while deleting the vaccination record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    console.log("Flock Data: ", flock);
  return (
     <TooltipProvider>
      <NotificationSystem />
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          
           <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <span>Flock Management</span>
            <ChevronRight className="h-4 w-4" />
            <span>Flocks</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{flock.name}</span>
          </div>
        
        <FlockOverview flock={flock}/>
        <PoultryPenOverview house={flock.poultry_house} quantity={flock.quantity} />

         {/* Metrics Tabs */}
       {
        view === "metrics" ? (
       <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Flock Metrics</CardTitle>
                <Button onClick={() => setView('schedule')} variant="outline" size="sm" className="hidden sm:inline-flex bg-secondary-100 hover:bg-secondary-200 text-secondary-800">
                  <span className="hidden sm:inline ">Schedule Management</span>
                  <span className="sm:hidden">Schedule</span>
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
                  <Tabs defaultValue="daily" className="w-full">
                <TabsList className="w-full overflow-x-auto">
                  <div className="flex min-w-max gap-1 p-1">
                    <TabsTrigger
                      value="daily"
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit"
                    >
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">Daily Records</span>
                      <span className="sm:hidden">Daily</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="mortality"
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline">Mortality</span>
                      <span className="sm:hidden">Mortality</span>
                    </TabsTrigger>
                   {
                   ( flock.poultry_type.name.toLowerCase() === "broiler" || flock.poultry_type.name.toLowerCase() === "dual purpose" )&&
                      <TabsTrigger
                      value="weight"
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit"
                    >
                      <Scale className="h-4 w-4" />
                      <span className="hidden sm:inline">Weight</span>
                      <span className="sm:hidden">Weight</span>
                    </TabsTrigger>
                   }
                     {
                        (flock.poultry_type.name.toLowerCase() === "layer" || flock.poultry_type.name.toLowerCase() === "dual purpose") &&
                       <TabsTrigger value="eggs" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit">
                      <Egg className="h-4 w-4" />
                      <span className="hidden sm:inline">Eggs</span>
                      <span className="sm:hidden">Eggs</span>
                    </TabsTrigger>
                    }
                    <TabsTrigger value="feed" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit">
                      <Wheat className="h-4 w-4" />
                      <span className="hidden sm:inline">Feed Usage</span>
                      <span className="sm:hidden">Feed</span>
                    </TabsTrigger>
                   
                    <TabsTrigger
                      value="medication"
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit"
                    >
                      <Pill className="h-4 w-4" />
                      <span className="hidden sm:inline">Medication Records</span>
                      <span className="sm:hidden">Meds</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="vaccination"
                      className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit"
                    >
                       <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Vaccination Records</span>
                      <span className="sm:hidden">vac</span>
                    </TabsTrigger>
                  </div>
                </TabsList>
                

                <TabsContent value="daily" className="mt-6">
                  {/* <DailyRecordsTab records={mockDailyRecords} /> */}
                  <div className="flex items-center  justify-end mb-4">
                    <Button 
                      onClick={() => setIsAddDailyRecordModalOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                     <Plus className="h-4 w-4" /> Add Daily Record
                    </Button>
                  </div>
                  {                    flock.daily_records && flock.daily_records.length > 0 ?
                       
                        <DailyRecord  records={flock.daily_records}/>
                    
                    
                    : (
                      <div className="text-center text-gray-500">No daily records available.</div>
                    )
                  }
                </TabsContent>

                <TabsContent value="mortality" className="mt-6">
                    <MortalityReportPage reports={flock.mortality_reports} flock={flock} onAddRecord={handleCreateMortalityRecord} />
                </TabsContent>

                <TabsContent value="weight" className="mt-6">
                 <WeightReportPage 
                   reports={flock.weight_reports} 
                   flock={flock} 
                   onAddRecord={handleCreateWeightReport} 
                   onDeleteRecord={handleDeleteWeightReport}
                 />
                </TabsContent>
               
                  <TabsContent value="eggs" className="mt-6">
                  <EggRecordPage reports={flock.egg_reports} />
                </TabsContent>

                <TabsContent value="feed" className="mt-6">
                    <FeedUsageView 
                      records={flock.poultry_feed_usages} 
                      flock={flock}
                      onAddRecord={handleCreateFeedUsageRecord}
                      onDeleteRecord={handleDeleteFeedUsageRecord}
                      feedInventories={feedInventories}
                      feedTypes={feedTypes}
                    />
                </TabsContent>

                <TabsContent value="medication" className="mt-6">
                    <MedicationRecordView 
                        records={flock.poultry_medication_records} 
                        flockId={flock.id} 
                        farmId={farmId || 0}
                        medications={[]}
                        medicationInventories={[]}
                        administrationMethods={administrationMethods}
                    />
                </TabsContent>
                <TabsContent value="vaccination" className="mt-6">
                    <VaccinationRecordView 
                        records={flock.poultry_vaccination_records} 
                        flockId={flock.id}
                        farmId={farmId || 0}
                        vaccines={vaccines}
                        vaccineInventories={vaccineInventories}
                        administrationMethods={administrationMethods}
                        onAddVaccinationRecord={handleCreateVaccinationRecord}
                        onDeleteVaccinationRecord={handleDeleteVaccinationRecord}
                    />
                </TabsContent>
                
         
            
              </Tabs>
            </CardContent>
          </Card>

        ) : (
          <div className="flex flex-col gap-4">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Batch Schedule</h2>
            <Button variant="outline" size="sm" onClick={() => setView("metrics")}>
              View Metrics
            </Button>
          </div>

          <BatchScheduleView  feedingSchedule =  {flock.batch_feeding_schedules}  vaccinationSchedule = {flock.batch_vaccination_schedules} medicationSchedule={flock.batch_medication_schedules} />

          </div>
        
        )
       }
          
        </div>
        </div>

        {/* Add Daily Record Modal */}
        <AddDailyRecordModal
          isOpen={isAddDailyRecordModalOpen}
          onClose={() => setIsAddDailyRecordModalOpen(false)}
          onSubmit={handleCreateDailyRecord}
          flockId={flock.id}
          poultryType={flock.poultry_type.name}
        />
    </TooltipProvider>
  )
}

export default FlockPage
