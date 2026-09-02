import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Scale,
  Egg,
  Heart,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  CalendarRange,
  Pill,
  Wheat,
  Activity,
  Shield,
  Plus,
  DollarSign,
  ShoppingBag,
  Lock,
  Pencil,
} from "lucide-react"
import { Link, useLoaderData } from "react-router-dom"
import type { DetailedFlockRecord, FeedInventoryType, FeedType, FlockProfitLoss, PoultryDailyReport, PoultryFeedUsageRecord } from "@/lib/types"
import { getDaysInFlock, formatDate, isFlockActive, cn } from "@/lib/utils"
import FlockOverview from "@/components/poultry/Flocks/FlockOverview"
import PoultryPenOverview from "@/components/poultry/pen/PoultryPenOverview"
import DailyRecord from "@/components/poultry/Flocks/DailyRecord"
import MortalityReportPage from "@/components/poultry/Flocks/MortalityReport"
import WeightReportPage from "@/components/poultry/Flocks/WeightReportPage"
import EggRecordPage from "@/components/poultry/Flocks/EggRecordPage"
import FeedUsageView from "@/components/poultry/Flocks/FeedUsageView"
import MedicationRecordView from "@/components/poultry/Flocks/MedicationRecordView"
import VaccinationRecordView from "@/components/poultry/Flocks/VaccinationRecordView"
import FlockExpenditureView from "@/components/poultry/Flocks/FlockExpenditureView"
import FlockSalesView from "@/components/poultry/Flocks/FlockSalesView"
import ProductSalesView from "@/components/poultry/Flocks/ProductSalesView"
import { Button } from "@/components/ui/button"
import { NotificationSystem } from "@/components/poultry/Flocks/Notification"
import FlockMetricsModal from "@/components/modals/FlockMetricsModal"
import { useState, useEffect } from "react"
import BatchScheduleView from "@/components/poultry/Flocks/batchSchedule/BatchScheduleView"
// import TodayActivities from "@/components/poultry/Flocks/TodayActivities 
import AddDailyRecordModal from "@/components/modals/AddDailyRecordModal"
import AddFlockModal from "@/components/modals/AddFlockModal"
import type { FlockFormData } from "@/components/modals/AddFlockModal"
import { createDailyRecord, createDailyRecordsBatch, updateDailyRecord, deleteDailyRecord, createMortalityRecord, deleteMortalityRecord, createWeightReport, deleteWeightReport, createFeedUsageRecord, deleteFeedUsageRecord, getFeedInventories, getFeedTypes, createVaccinationRecord, deleteVaccinationRecord, getVaccines, getVaccineInventories, getAdministrationMethods, getMedications, createMedicationRecord, deleteMedicationRecord, getFlock, createFlockExpenditure, updateFlockExpenditure, deleteFlockExpenditure, getFlockExpenditures, createFlockSale, updateFlockSale, deleteFlockSale, getFlockProfitLoss, updateFlock } from "@/lib/request"
import type { BatchSubmitResult } from "@/components/modals/AddDailyRecordModal"
import type { DailyRecordFormData } from "@/components/modals/dailyRecordForm"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import TodayActivities from "@/components/poultry/Flocks/TodayActivities"
import TransferFlockModal from "@/components/modals/TransferFlockModal"
import { getFlockAllocations, getFlockTransfers } from "@/lib/request"
import type { FlockAllocationRow, FlockTransferRecord } from "@/lib/request"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
const FlockPage = () => {
    const {Flock: initialFlock} = useLoaderData() as {Flock: DetailedFlockRecord};
    const [flock, setFlock] = useState<DetailedFlockRecord>(initialFlock);
    const [view, setView] = useState<"metrics" | "schedule" >("metrics");
    const [isAddDailyRecordModalOpen, setIsAddDailyRecordModalOpen] = useState(false);
    const [editingDailyRecord, setEditingDailyRecord] = useState<PoultryDailyReport | null>(null);
    const [feedInventories, setFeedInventories] = useState<FeedInventoryType[]>([]);
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
    const [vaccines, setVaccines] = useState<any[]>([]);
    const [vaccineInventories, setVaccineInventories] = useState<any[]>([]);
    const [administrationMethods, setAdministrationMethods] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [medicationInventories, setMedicationInventories] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<FlockAllocationRow[]>([]);
    const [transfers, setTransfers] = useState<FlockTransferRecord[]>([]);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(true);
    const [flockProfitLoss, setFlockProfitLoss] = useState<FlockProfitLoss | null>(null);
    const [isEditFlockModalOpen, setIsEditFlockModalOpen] = useState(false);
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
    
    const token = useSelector((state: RootState) => state.authentication.token);
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
    const { canAny } = usePermissions();

    const canCreateRecords = canAny([...ACTIONS.records.create]);
    const canUpdateRecords = canAny([...ACTIONS.records.update]);
    const canDeleteRecords = canAny([...ACTIONS.records.delete]);
    const canCreateFeedUsages = canAny([...ACTIONS.feedUsages.create]);
    const canDeleteFeedUsages = canAny([...ACTIONS.feedUsages.delete]);
    const canCreateSales = canAny([...ACTIONS.sales.create]);
    const canUpdateSales = canAny([...ACTIONS.sales.update]);
    const canDeleteSales = canAny([...ACTIONS.sales.delete]);

    // Compute current age of the flock in days (used for schedule views)
    const arrivalDate = new Date(flock.arrival_date);
    const now = new Date();
    const daysSinceArrival = Math.floor(
      (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentAge = flock.arrival_age_days + daysSinceArrival;
    const daysInFlock = getDaysInFlock(
      flock.arrival_date,
      flock.actual_end_date,
      flock.status === "active"
    );
    const isBatchActive = isFlockActive(flock.status);
    const currentFeedingDay = daysSinceArrival + 1;

    const openMetrics = () => {
      setIsMetricsModalOpen(true);
    };

    // House Details should reflect the flock's current distribution.
    // Since birds can move/split across houses, prefer the currently allocated house (from `allocations`)
    // instead of the initial `flock.poultry_house`.
    const allocationsSortedByQty = allocations
      .filter((a) => Number(a.quantity || 0) > 0)
      .concat(allocations.filter((a) => Number(a.quantity || 0) <= 0));
    const primaryAllocationForDetails = allocationsSortedByQty
      .slice()
      .sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0];
    const penHouseForDetails = primaryAllocationForDetails?.house ?? flock.poultry_house;
    const penQuantityForDetails = primaryAllocationForDetails
      ? Number(primaryAllocationForDetails.quantity || 0)
      : flock.actual_quantity;

    // Function to refresh flock data
    const refreshFlock = async (): Promise<DetailedFlockRecord | null> => {
        if (!farmId || !token || !flock.id) return null;
        
        try {
            const response = await getFlock(token, farmId, flock.id);
            if (response.success && response.data) {
                setFlock(response.data);
                await refreshFlockProfitLoss();
                return response.data;
            }
        } catch (error) {
            console.error("Error refreshing flock data:", error);
        }
        return null;
    };

    const refreshFlockProfitLoss = async () => {
        if (!farmId || !token || !flock.id) return;
        try {
            const response = await getFlockProfitLoss(token, farmId, flock.id);
            if (response.success && response.data) {
                setFlockProfitLoss(response.data);
            }
        } catch (error) {
            console.error("Error refreshing flock profit and loss:", error);
        }
    };

    const refreshExpenditures = async () => {
        if (!farmId || !token || !flock.id) return;
        const response = await getFlockExpenditures(token, farmId, flock.id);
        if (response.success && response.data) {
            setFlock((prev) => ({
                ...prev,
                flock_expenditures: response.data!,
            }));
        }
        await refreshFlockProfitLoss();
    };

    const refreshAllocations = async () => {
        if (!farmId || !token || !flock.id) return;
        const res = await getFlockAllocations(token, farmId, flock.id);
        if (res.success && Array.isArray(res.data)) setAllocations(res.data);
    };

    const refreshTransfers = async () => {
        if (!farmId || !token || !flock.id) return;
        const res = await getFlockTransfers(token, farmId, flock.id);
        if (res.success && Array.isArray(res.data)) setTransfers(res.data);
    };

    const refreshFeedInventories = async () => {
        if (!farmId || !token) return;
        const res = await getFeedInventories(token, farmId);
        if (res.success && Array.isArray(res.data)) {
            setFeedInventories(res.data);
        }
    };

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
                    administrationMethodsResponse,
                    medicationsResponse
                ] = await Promise.all([
                    getFeedInventories(token, farmId),
                    getFeedTypes(token, farmId, flock.poultry_type_id),
                    getVaccines(token, farmId),
                    getVaccineInventories(token, farmId),
                    getAdministrationMethods(token, farmId),
                    getMedications(token, farmId)
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

                if (medicationsResponse.success && Array.isArray(medicationsResponse.data)) {
                    setMedications(medicationsResponse.data);
                } else {
                    setMedications([]);
                }

                // Medication inventories are not provided by the current request exports; default to empty.
                setMedicationInventories([]);
            } catch (error) {
                console.error("Error fetching flock page data:", error);
                // Reset to safe defaults on failure
                setFeedInventories([]);
                setFeedTypes([]);
                setVaccines([]);
                setVaccineInventories([]);
                setAdministrationMethods([]);
                setMedications([]);
                setMedicationInventories([]);
            }
        };
        
        fetchData();
        refreshAllocations();
        refreshFlockProfitLoss();
        refreshTransfers();
    }, [farmId, token, flock.poultry_type_id]);

    const handleCloseDailyRecordModal = () => {
        setIsAddDailyRecordModalOpen(false);
        setEditingDailyRecord(null);
    };

    const handleDeleteDailyRecord = async (recordId: number) => {
        if (!farmId || !token) return;

        const response = await deleteDailyRecord(token, farmId, recordId);
        if (response.success) {
            if (editingDailyRecord?.id === recordId) {
                handleCloseDailyRecordModal();
            }
            await refreshFlock();
            await refreshFeedInventories();
        } else {
            const errorMessage = Array.isArray(response.error) && response.error.length > 0
                ? response.error.join(", ")
                : (typeof response.error === "string" ? response.error : "Failed to delete daily record");
            throw new Error(errorMessage);
        }
    };

    const handleDailyRecordSubmit = async (
        records: DailyRecordFormData[],
        options?: { recordId?: number }
    ): Promise<BatchSubmitResult | void> => {
        if (!farmId || !token) return;

        try {
            if (options?.recordId) {
                const response = await updateDailyRecord(token, farmId, options.recordId, records[0]);

                if (response.success) {
                    toast.success("Daily record updated successfully!");
                    handleCloseDailyRecordModal();
                    await refreshFlock();
                    await refreshFeedInventories();
                await refreshExpenditures();
                    return;
                }

                const errorMessage = Array.isArray(response.error) && response.error.length > 0
                    ? response.error.join(", ")
                    : (typeof response.error === "string" ? response.error : "Failed to update daily record");
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }

            if (records.length === 1) {
                const response = await createDailyRecord(token, farmId, flock.id, records[0]);

                if (response.success) {
                    toast.success("Daily record created successfully!");
                    handleCloseDailyRecordModal();
                    await refreshFlock();
                    await refreshFeedInventories();
                await refreshExpenditures();
                    return;
                }

                const errorMessage = Array.isArray(response.error) && response.error.length > 0
                    ? response.error.join(", ")
                    : (typeof response.error === "string" ? response.error : "Failed to create daily record");
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }

            const result = await createDailyRecordsBatch(token, farmId, flock.id, records);
            await refreshFlock();
            await refreshFeedInventories();

            if (result.failed.length === 0) {
                toast.success(`${result.succeeded} daily records created successfully!`);
                handleCloseDailyRecordModal();
                return;
            }

            if (result.succeeded > 0) {
                toast.warning(`${result.succeeded} saved, ${result.failed.length} failed`);
            } else {
                toast.error(`All ${result.failed.length} records failed to save`);
            }

            return result;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            toast.error(options?.recordId
                ? "An error occurred while updating the daily record. Please try again."
                : "An error occurred while creating the daily record. Please try again.");
            throw new Error("Network or unexpected error occurred");
        }
    };

    const handleCreateMortalityRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createMortalityRecord(token, farmId, recordData);
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

    const handleDeleteMortalityRecord = async (recordId: number) => {
        if (!farmId || !token) return;

        try {
            const response = await deleteMortalityRecord(token, farmId, recordId);
            if (response.success) {
                setFlock(prevFlock => ({
                    ...prevFlock,
                    mortality_reports: prevFlock.mortality_reports.filter(report => report.id !== recordId)
                }));
            } else {
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
            console.error("Error deleting mortality record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            }
            toast.error("An error occurred while deleting the mortality record. Please try again.");
            throw new Error("Network or unexpected error occurred");
        }
    };

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
                toast.success("Feed usage record created successfully!");
                await refreshFeedInventories();
                await refreshExpenditures();

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
                    await refreshExpenditures();
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
                toast.success("Feed usage record deleted successfully! Inventory has been restored.");
                
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_feed_usages: prevFlock.poultry_feed_usages.filter(record => record.id !== recordId)
                }));
                await refreshFeedInventories();
                await refreshExpenditures();
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
                await refreshExpenditures();
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
                await refreshExpenditures();
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

    const handleCreateMedicationRecord = async (recordData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createMedicationRecord(token, farmId, recordData);
            if (response.success) {
                console.log("Medication record created successfully:", response.data);
                toast.success("Medication record created successfully!");
                
                // Update the local flock state with the new medication record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_medication_records: [...prevFlock.poultry_medication_records, response.data]
                }));
                await refreshExpenditures();
            } else {
                console.error("Failed to create medication record:", response);
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
            console.error("Error creating medication record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while creating the medication record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const handleDeleteMedicationRecord = async (recordId: number) => {
        if (!farmId || !token) return;
        
        try {
            const response = await deleteMedicationRecord(token, farmId, recordId);
            if (response.success) {
                console.log("Medication record deleted successfully");
                toast.success("Medication record deleted successfully! Inventory has been restored.");
                
                // Update the local flock state by removing the deleted medication record
                setFlock(prevFlock => ({
                    ...prevFlock,
                    poultry_medication_records: prevFlock.poultry_medication_records.filter(record => record.id !== recordId)
                }));
                await refreshExpenditures();
            } else {
                console.error("Failed to delete medication record:", response);
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
            console.error("Error deleting medication record:", error);
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                throw error;
            } else {
                toast.error("An error occurred while deleting the medication record. Please try again.");
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const totalMortality = flock.mortality_reports?.reduce((sum, r) => sum + (r.mortality_count || 0), 0) ?? 0;
    const totalEggs = flock.egg_reports?.reduce((sum, r) => sum + (r.eggs_collected || 0), 0) ?? 0;

    const handleUpdateFlock = async (flockData: FlockFormData) => {
        if (!token || !farmId) return;

        const response = await updateFlock(token, farmId, flock.id, {
            name: flockData.name,
            breed: flockData.breed,
            source: flockData.source,
            quantity: flockData.quantity,
            arrival_date: flockData.arrival_date,
            arrival_age_days: flockData.arrival_age_days,
            expected_end_date: flockData.expected_end_date || undefined,
            poultry_type_id: flockData.poultry_type_id,
            flock_stage_id: flockData.flock_stage_id,
            house_id: flockData.house_id,
            notes: flockData.notes,
        });

        if (!response.success) {
            const message = Array.isArray(response.error)
                ? response.error.join(", ")
                : response.error || "Failed to update flock";
            toast.error(message);
            throw new Error(message);
        }

        toast.success("Flock updated successfully");
        await refreshFlock();
        const allocationsRes = await getFlockAllocations(token, farmId, flock.id);
        if (allocationsRes.success && allocationsRes.data) {
            setAllocations(allocationsRes.data);
        }
    };

    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span>Flock Management</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>Flocks</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-gray-800 font-medium truncate max-w-[160px] md:max-w-xs">
                    {flock.name}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {flock.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Batch <span className="font-semibold">{flock.batch_number}</span> ·{" "}
                  {flock.breed} · {flock.poultry_type.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <ActionGate anyOf={ACTIONS.flocks.update}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 disabled:opacity-50"
                    onClick={() => setIsEditFlockModalOpen(true)}
                    disabled={!isBatchActive}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Flock
                  </Button>
                </ActionGate>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300"
                  asChild
                >
                  <Link to={`/dashboard/poultry/flock-management/${flock.id}/activities`}>
                    <CalendarRange className="h-4 w-4 mr-2" />
                    Activities Report
                  </Link>
                </Button>
                <Button
                  variant={isMetricsModalOpen ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    isMetricsModalOpen
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-gray-300"
                  )}
                  onClick={openMetrics}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Metrics
                </Button>
                <ActionGate anyOf={ACTIONS.records.create}>
                  <Button
                    size="sm"
                    onClick={() => setIsAddDailyRecordModalOpen(true)}
                    disabled={!isBatchActive}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Daily Record
                  </Button>
                </ActionGate>
              </div>
            </div>

            {!isBatchActive && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">This batch has ended</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Records and updates are locked. You can still view historical data.
                    {flock.actual_end_date ? ` Ended ${formatDate(flock.actual_end_date)}.` : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Notifications */}
            <NotificationSystem
              flockId={flock.id}
              flockName={flock.name}
              onOpenSchedule={() => setView("schedule")}
            />

            {/* Current distribution (multi-pen) */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Current distribution</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      This flock can be spread across multiple houses. Transfers keep a full history.
                    </p>
                  </div>
                  <ActionGate anyOf={ACTIONS.flocks.update}>
                    <Button
                      size="sm"
                      onClick={() => setIsTransferOpen(true)}
                      disabled={!isBatchActive}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white disabled:opacity-50"
                    >
                      Transfer birds
                    </Button>
                  </ActionGate>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {allocations.length === 0 ? (
                  <div className="text-sm text-gray-600">No allocations found yet.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>House</span>
                      <span>Birds</span>
                    </div>
                    {allocations.map((a) => (
                      <div
                        key={`${a.house_id}`}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {a.house?.name ?? `House #${a.house_id}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {a.house?.house_type ?? a.house?.type ?? "Poultry house"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {Number(a.quantity || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold text-gray-900">
                        {allocations.reduce((s, r) => s + Number(r.quantity || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer history */}
            <Collapsible open={isTransferHistoryOpen} onOpenChange={setIsTransferHistoryOpen}>
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">Transfer history</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        Every move/split/merge is recorded here for audit and traceability.
                        {!isTransferHistoryOpen && transfers.length > 0 ? (
                          <span className="ml-1 font-medium text-gray-700">
                            ({transfers.length} {transfers.length === 1 ? "entry" : "entries"})
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 border-gray-200 text-gray-600 hover:text-gray-900"
                        aria-label={isTransferHistoryOpen ? "Minimise transfer history" : "Expand transfer history"}
                      >
                        {isTransferHistoryOpen ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Minimise
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Expand
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {transfers.length === 0 ? (
                      <div className="text-sm text-gray-600">No transfers recorded yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {transfers.slice(0, 8).map((t) => (
                          <div key={t.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(t.transfer_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t.lines?.reduce((s, l) => s + Number(l.quantity || 0), 0).toLocaleString()} birds
                              </p>
                            </div>
                            {t.note ? <p className="text-xs text-gray-600 mt-1">{t.note}</p> : null}
                            <div className="mt-2 space-y-1">
                              {(t.lines || []).map((l) => (
                                <div
                                  key={l.id}
                                  className="flex items-center justify-between text-xs text-gray-700"
                                >
                                  <span className="min-w-0 truncate">
                                    {(l.fromHouse?.name ?? (l.from_house_id ? `House #${l.from_house_id}` : "—"))}{" "}
                                    → {(l.toHouse?.name ?? (l.to_house_id ? `House #${l.to_house_id}` : "—"))}
                                  </span>
                                  <span className="font-medium">{Number(l.quantity || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {transfers.length > 8 ? (
                          <p className="text-xs text-gray-500">Showing latest 8 transfers.</p>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Stat strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Current Birds</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {flock.actual_quantity.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-1">Mortality</p>
                    <p className="text-2xl font-bold text-red-900">
                      {totalMortality.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-600 font-medium mb-1">Days In Flock</p>
                    <p className="text-2xl font-bold text-amber-900">{daysInFlock}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium mb-1">
                      {flock.poultry_type.name.toLowerCase().includes("layer") ? "Total Eggs" : "Records"}
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {flock.poultry_type.name.toLowerCase().includes("layer")
                        ? totalEggs.toLocaleString()
                        : flock.daily_records?.length ?? 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    {flock.poultry_type.name.toLowerCase().includes("layer") ? (
                      <Egg className="h-5 w-5 text-white" />
                    ) : (
                      <Activity className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Overview & today activities */}
            <FlockOverview flock={flock} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <TodayActivities flock={flock} />
              </div>
              <div>
                <PoultryPenOverview house={penHouseForDetails} quantity={penQuantityForDetails} />
              </div>
            </div>

            {/* Metrics vs Schedule */}
            {view === "metrics" ? (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Flock Records</CardTitle>
                    <p className="text-xs text-gray-500">
                      Manage daily records, health, feed, costs, and sales for this flock.
                    </p>
                  </div>
                  <Button
                    onClick={() => setView("schedule")}
                    variant="outline"
                    size="sm"
                    className="bg-gray-50 hover:bg-gray-100"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule Management
                  </Button>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="w-full bg-gray-100 rounded-lg p-1 overflow-x-auto">
                      <div className="flex min-w-max gap-1">
                        <TabsTrigger
                          value="daily"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Activity className="h-4 w-4" />
                          <span className="hidden sm:inline">Daily Records</span>
                          <span className="sm:hidden">Daily</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="mortality"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Heart className="h-4 w-4" />
                          <span className="hidden sm:inline">Mortality</span>
                          <span className="sm:hidden">Mortality</span>
                        </TabsTrigger>
                        {(flock.poultry_type.name.toLowerCase() === "broiler" ||
                          flock.poultry_type.name.toLowerCase() === "dual purpose") && (
                          <TabsTrigger
                            value="weight"
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                          >
                            <Scale className="h-4 w-4" />
                            <span className="hidden sm:inline">Weight</span>
                            <span className="sm:hidden">Weight</span>
                          </TabsTrigger>
                        )}
                        {(flock.poultry_type.name.toLowerCase() === "layer" ||
                          flock.poultry_type.name.toLowerCase() === "dual purpose") && (
                          <TabsTrigger
                            value="eggs"
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                          >
                            <Egg className="h-4 w-4" />
                            <span className="hidden sm:inline">Eggs</span>
                            <span className="sm:hidden">Eggs</span>
                          </TabsTrigger>
                        )}
                        <TabsTrigger
                          value="feed"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Wheat className="h-4 w-4" />
                          <span className="hidden sm:inline">Feed Usage</span>
                          <span className="sm:hidden">Feed</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="medication"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Pill className="h-4 w-4" />
                          <span className="hidden sm:inline">Medication Records</span>
                          <span className="sm:hidden">Meds</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="vaccination"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Shield className="h-4 w-4" />
                          <span className="hidden sm:inline">Vaccination Records</span>
                          <span className="sm:hidden">Vac</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="expenditure"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span className="hidden sm:inline">Expenditure</span>
                          <span className="sm:hidden">Cost</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="sales"
                          className="flex items-center gap-2 whitespace-nowrap px-3 py-2 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          <span className="hidden sm:inline">Sales</span>
                          <span className="sm:hidden">Sales</span>
                        </TabsTrigger>
                      </div>
                    </TabsList>

                    <TabsContent value="daily" className="mt-6">
                      {isBatchActive && canCreateRecords && (
                        <div className="flex items-center justify-end mb-4">
                          <ActionGate anyOf={ACTIONS.records.create}>
                            <Button
                              onClick={() => setIsAddDailyRecordModalOpen(true)}
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Daily Record
                            </Button>
                          </ActionGate>
                        </div>
                      )}
                      {flock.daily_records && flock.daily_records.length > 0 ? (
                        <DailyRecord
                          records={flock.daily_records}
                          flockName={flock.name}
                          onEdit={isBatchActive && canUpdateRecords ? (record) => setEditingDailyRecord(record) : undefined}
                          onDelete={isBatchActive && canDeleteRecords ? handleDeleteDailyRecord : undefined}
                        />
                      ) : (
                        <div className="text-center text-gray-500 text-sm py-8">
                          No daily records available.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="mortality" className="mt-6">
                      <MortalityReportPage
                        reports={flock.mortality_reports}
                        flock={flock}
                        onAddRecord={isBatchActive && canCreateRecords ? handleCreateMortalityRecord : undefined}
                        onDeleteRecord={isBatchActive && canDeleteRecords ? handleDeleteMortalityRecord : undefined}
                      />
                    </TabsContent>

                    <TabsContent value="weight" className="mt-6">
                      <WeightReportPage
                        reports={flock.weight_reports}
                        flock={flock}
                        onAddRecord={isBatchActive && canCreateRecords ? handleCreateWeightReport : undefined}
                        onDeleteRecord={isBatchActive && canDeleteRecords ? handleDeleteWeightReport : undefined}
                      />
                    </TabsContent>

                    <TabsContent value="eggs" className="mt-6">
                      <EggRecordPage reports={flock.egg_reports} flockName={flock.name} />
                    </TabsContent>

                    <TabsContent value="feed" className="mt-6">
                      <FeedUsageView
                        records={flock.poultry_feed_usages}
                        flock={flock}
                        onAddRecord={isBatchActive && canCreateFeedUsages ? handleCreateFeedUsageRecord : undefined}
                        onDeleteRecord={isBatchActive && canDeleteFeedUsages ? handleDeleteFeedUsageRecord : undefined}
                        feedInventories={feedInventories}
                        feedTypes={feedTypes}
                      />
                    </TabsContent>

                    <TabsContent value="medication" className="mt-6">
                      <MedicationRecordView
                        records={flock.poultry_medication_records}
                        flockId={flock.id}
                        farmId={farmId || 0}
                        flockName={flock.name}
                        medications={medications}
                        medicationInventories={medicationInventories}
                        administrationMethods={administrationMethods}
                        onAddMedicationRecord={isBatchActive && canCreateRecords ? handleCreateMedicationRecord : undefined}
                        onDeleteMedicationRecord={isBatchActive && canDeleteRecords ? handleDeleteMedicationRecord : undefined}
                      />
                    </TabsContent>

                    <TabsContent value="vaccination" className="mt-6">
                      <VaccinationRecordView
                        records={flock.poultry_vaccination_records}
                        flockId={flock.id}
                        farmId={farmId || 0}
                        flockName={flock.name}
                        vaccines={vaccines}
                        vaccineInventories={vaccineInventories}
                        administrationMethods={administrationMethods}
                        vaccinationSchedules={flock.batch_vaccination_schedules}
                        currentAge={currentAge}
                        onOpenSchedule={() => setView("schedule")}
                        onRefresh={async () => { await refreshFlock(); }}
                        onAddVaccinationRecord={isBatchActive && canCreateRecords ? handleCreateVaccinationRecord : undefined}
                        onDeleteVaccinationRecord={isBatchActive && canDeleteRecords ? handleDeleteVaccinationRecord : undefined}
                      />
                    </TabsContent>

                    <TabsContent value="expenditure" className="mt-6">
                      <FlockExpenditureView
                        flock={flock}
                        profitLoss={flockProfitLoss}
                        onRefresh={refreshExpenditures}
                        onAddExpenditure={isBatchActive && canCreateRecords ? async (payload) => {
                          if (!farmId || !token || !payload.category || payload.amount == null) return;
                          const res = await createFlockExpenditure(token, farmId, flock.id, {
                            category: payload.category,
                            amount: payload.amount,
                            currency: payload.currency,
                            description: payload.description,
                            payment_method: payload.payment_method,
                            reference_no: payload.reference_no,
                            date: payload.date,
                          });
                          if (res.success && res.data) {
                            setFlock((prev) => ({
                              ...prev,
                              flock_expenditures: [...(prev.flock_expenditures || []), res.data!],
                            }));
                            await refreshFlockProfitLoss();
                            toast.success("Expenditure added");
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                        onUpdateExpenditure={canUpdateRecords && farmId && token ? async (expenditureId, payload) => {
                          if (!farmId || !token) return;
                          const res = await updateFlockExpenditure(token, farmId, flock.id, expenditureId, payload);
                          if (res.success && res.data) {
                            setFlock((prev) => ({
                              ...prev,
                              flock_expenditures: (prev.flock_expenditures || []).map((item) =>
                                item.id === expenditureId ? res.data! : item
                              ),
                            }));
                            await refreshFlockProfitLoss();
                            toast.success("Expenditure updated");
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                        onDeleteExpenditure={isBatchActive && canDeleteRecords && farmId && token ? async (expenditureId) => {
                          const res = await deleteFlockExpenditure(token, farmId, flock.id, expenditureId);
                          if (res.success) {
                            setFlock((prev) => ({
                              ...prev,
                              flock_expenditures: (prev.flock_expenditures || []).filter((item) => item.id !== expenditureId),
                            }));
                            await refreshFlockProfitLoss();
                            toast.success("Expenditure deleted");
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                      />
                    </TabsContent>

                    <TabsContent value="sales" className="mt-6">
                      <FlockSalesView
                        flock={flock}
                        profitLoss={flockProfitLoss}
                        onAddSale={isBatchActive && canCreateSales ? async (payload) => {
                          if (!farmId || !token) return;
                          const res = await createFlockSale(token, farmId, flock.id, payload);
                          if (res.success) {
                            const updated = await refreshFlock();
                            if (updated?.status === "sold" && updated.actual_quantity === 0) {
                              toast.success("Sale recorded. Batch ended — all birds have been sold.");
                            } else {
                              toast.success("Sale recorded");
                            }
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                        onUpdateSale={isBatchActive && canUpdateSales ? async (saleId, payload) => {
                          if (!farmId || !token) return;
                          const res = await updateFlockSale(token, farmId, flock.id, saleId, payload);
                          if (res.success) {
                            const updated = await refreshFlock();
                            if (updated?.status === "sold" && updated.actual_quantity === 0) {
                              toast.success("Sale updated. Batch ended — all birds have been sold.");
                            } else {
                              toast.success("Sale updated");
                            }
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                        onDeleteSale={isBatchActive && canDeleteSales ? async (saleId) => {
                          if (!farmId || !token) return;
                          const res = await deleteFlockSale(token, farmId, flock.id, saleId);
                          if (res.success) {
                            await refreshFlock();
                            toast.success("Sale deleted");
                          } else if (!res.success) {
                            const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
                            toast.error(msg);
                          }
                        } : undefined}
                      />
                      <ProductSalesView
                        flockId={flock.id}
                        flockName={flock.name}
                        canManage={isBatchActive && canCreateSales}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <BatchScheduleView
                  feedingSchedule={flock.batch_feeding_schedules}
                  vaccinationSchedule={flock.batch_vaccination_schedules}
                  medicationSchedule={flock.batch_medication_schedules}
                  flockQuantity={flock.actual_quantity}
                  flockId={flock.id}
                  flockName={flock.name}
                  flockStatus={flock.status}
                  poultryTypeId={flock.poultry_type_id}
                  poultryTypeName={flock.poultry_type?.name}
                  currentAge={currentAge}
                  currentFeedingDay={currentFeedingDay}
                  arrivalDate={flock.arrival_date}
                  onRefresh={refreshFlock}
                  onBatchClosed={refreshFlock}
                  onBack={() => setView("metrics")}
                />
              </div>
            )}
          </div>

          {/* Add Daily Record Modal */}
          <FlockMetricsModal
            open={isMetricsModalOpen}
            onOpenChange={setIsMetricsModalOpen}
            flock={flock}
            profitLoss={flockProfitLoss}
            daysInFlock={daysInFlock}
            currentAge={currentAge}
          />

          <AddDailyRecordModal
            isOpen={isAddDailyRecordModalOpen || editingDailyRecord !== null}
            onClose={handleCloseDailyRecordModal}
            onSubmit={handleDailyRecordSubmit}
            editingRecord={editingDailyRecord}
            editingInventoryId={
              editingDailyRecord
                ? (
                    flock.poultry_feed_usages?.find((usage) => {
                      const usageDate = usage.usage_date?.includes("T")
                        ? usage.usage_date.split("T")[0]
                        : usage.usage_date
                      const recordDate = editingDailyRecord.date?.includes("T")
                        ? editingDailyRecord.date.split("T")[0]
                        : editingDailyRecord.date
                      return usageDate === recordDate
                    })?.poultry_feed_inventory_id ?? null
                  )
                : null
            }
            existingRecordDates={flock.daily_records?.map((record) => record.date) ?? []}
            flockId={flock.id}
            flockQuantity={flock.actual_quantity}
            farmId={farmId!}
            token={token!}
            poultryType={flock.poultry_type.name}
            flockArrivalDate={flock.arrival_date}
            flockArrivalAgeDays={flock.arrival_age_days}
            feedInventories={feedInventories}
            feedTypes={feedTypes}
          />

          <AddFlockModal
            isOpen={isEditFlockModalOpen}
            onClose={() => setIsEditFlockModalOpen(false)}
            onSubmit={handleUpdateFlock}
            editingFlock={flock}
          />

          {/* Transfer birds (multi-pen) */}
          {farmId && token && (
            <TransferFlockModal
              open={isTransferOpen}
              onOpenChange={setIsTransferOpen}
              token={token}
              farmId={farmId}
              flockId={flock.id}
              allocations={allocations}
              onSuccess={() => {
                refreshAllocations()
                refreshTransfers()
                refreshFlock()
              }}
            />
          )}
        </div>
      </TooltipProvider>
    )
}

export default FlockPage
