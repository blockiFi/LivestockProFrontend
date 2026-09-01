import type { LoadPoultryOverviewDataType } from "@/lib/interfaces";
import { Authenticated, LoadFeedinVentories, LoadFlockData, LoadMedicationData, LoadMedicationInventories, LoadPermissionGroups, LoadPoultryOverviewData, LoadRolesWithPermissions, LoadVaccineData, LoadVaccineInventories, LoadFarmUsers, LoadActiveFarm, LoadSalesProfitLossData, LoadFarmDashboard } from "@/lib/loader";
import type { DetailedFlockRecord, Farm, FarmDashboard } from "@/lib/types";
import { exportRoutes } from "@/lib/utils";
import FlockManagementPage from "@/pages/poultry/FlockManagementPage";
import HousingManagementPage from "@/pages/poultry/HousingManagementPage";
import FlockPage from "@/pages/poultry/FlockPage";
import OverviewPage from "@/pages/poultry/OverviewPage";
import ScheduleManagementPage from "@/pages/poultry/ScheduleManagementPage";
import TaskManagementPage from "@/pages/poultry/TaskManagementPage";
import MedicationsPage from "@/pages/poultry/health/MedicationsPage";
import MedicationProductsPage from "@/pages/poultry/health/MedicationProductsPage";
import VaccinationsPage from "@/pages/poultry/health/VaccinationsPage";
import VaccinationProductsPage from "@/pages/poultry/health/VaccinationProductsPage";
import { redirect } from "react-router-dom";
import { toast } from "react-toastify";
import MedicationInventoriesPage from "@/pages/poultry/inventory/MedicationInventoriesPage";
import VaccinationInventoriesPage from "@/pages/poultry/inventory/VaccinationInventoriesPage";
import FeedInventoriesPage from "@/pages/poultry/inventory/FeedInventoriesPage";
import FeedComponentsPage from "@/pages/poultry/feed/FeedComponentsPage";
import FeedCompositionsPage from "@/pages/poultry/feed/FeedCompositionsPage";
import FeedFormulationPage from "@/pages/poultry/feed/FeedFormulationPage";
import PermissionManagementPage from "@/pages/poultry/permission/permissionManagementPage";
import RoleManagementPage from "@/pages/poultry/permission/roleManagementPage";
import UserRoleManagementPage from "@/pages/poultry/permission/userRoleManagementPage";
import SalesProfitLossPage from "@/pages/poultry/analytics/SalesProfitLossPage";

const PoultryRoutes = [
    {
        path: "/",
        loader : async (): Promise<{ currentFarm: Farm | null; dashboard: FarmDashboard | null; error?: string | null }> => {
            const { currentFarm, dashboard, error } = await LoadFarmDashboard({ preset: "30d" });
            return { currentFarm, dashboard, error };
        },
        element : <OverviewPage />
    },
    {
        path: "/flock-management",
        loader: async () : Promise<LoadPoultryOverviewDataType> =>{
            const {PoultryStatistics , currentFarm } = await LoadPoultryOverviewData();
            return {PoultryStatistics , currentFarm};
        },
        element : <FlockManagementPage />
    },
    {
        path: "/houses",
        loader: async () : Promise<LoadPoultryOverviewDataType> =>{
            const {PoultryStatistics , currentFarm } = await LoadPoultryOverviewData();
            return {PoultryStatistics , currentFarm};
        },
        element : <HousingManagementPage />
    },
    {
        path: "/flock-management/:flockId",
        loader: async ({ params }: { params: { flockId?: string } }): Promise<{ Flock: DetailedFlockRecord }> => {
            const rawId = params.flockId;
            const flockId = rawId ? Number(rawId) : NaN;

            if (!rawId || Number.isNaN(flockId)) {
                toast.error("Invalid flock ID");
                throw new Error("Invalid flock ID");
            }

            console.log("Flock ID: ", flockId);
            const { Flock } = await LoadFlockData(flockId);

            if (Flock === null) {
                toast.error("Flock not found");
                // Redirect back to the flock list under the dashboard
                return redirect("/dashboard/poultry/flock-management") as unknown as { Flock: DetailedFlockRecord };
            }

            console.log(Flock);
              return { Flock };
    },
        element: <FlockPage />
},
{
    path : "/schedules" , 
    loader : async () => {
     const authenticated : boolean = await Authenticated();
      if(authenticated){
       
      } else{
        toast.error("You must be logged in to access this page.");
        return redirect('/login')
      }
    },
    element : <ScheduleManagementPage />
},
{
    path : "/tasks" ,
    loader : async () => {
     const authenticated : boolean = await Authenticated();
      if(authenticated){

      } else{
        toast.error("You must be logged in to access this page.");
        return redirect('/login')
      }
    },
    element : <TaskManagementPage />
},
// Health section routes
{
  path: "/health/medications",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const {medications} = await LoadMedicationData();
    return {medications};
  },
  element: <MedicationsPage />
},
{
  path: "/health/medication-products",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const {medications} = await LoadMedicationData();
    return {medications};
  },
  element: <MedicationProductsPage />
},
{
  path: "/health/vaccinations",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const { vaccines } = await LoadVaccineData();
    return { vaccines };
  },
  element: <VaccinationsPage />
},
{
  path: "/health/vaccination-products",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    return null;
  },
  element: <VaccinationProductsPage />
}, 
{
  path: "/inventory/medications",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const {medicationInventories} = await LoadMedicationInventories();
    return {medicationInventories}
    
  },
  element: <MedicationInventoriesPage />  

},
{
  path: "/inventory/vaccination"  , 
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const {vaccineInventories} = await LoadVaccineInventories();
    console.log("Vaccine Inventories: loader ", vaccineInventories);
    return {vaccineInventories}
  },
  element: <VaccinationInventoriesPage />  

},
{
  path: "/inventory/feeds",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const {feedInventories} = await LoadFeedinVentories();
    return {feedInventories}
  },
  element: <FeedInventoriesPage />
},
{
  path: "/feed/components",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    return null;
  },
  element: <FeedComponentsPage />
},
{
  path: "/feed/compositions",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    return null;
  },
  element: <FeedCompositionsPage />
},
{
  path: "/feed/formulation",
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    return null;
  },
  element: <FeedFormulationPage />
},
{
  path: '/permission/permissions',
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const { PermissionGroups } = await LoadPermissionGroups();
    return { PermissionGroups };
  },
  element: <PermissionManagementPage />
},
{
  path: '/permission/roles',
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const { roles } = await LoadRolesWithPermissions();
    return { roles };
  },
  element: <RoleManagementPage />
},
{
  path: '/permission/user-roles',
  loader: async () => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const { currentFarm } = await LoadActiveFarm();
    if (currentFarm === null) {
      toast.error("No farm selected. Please select a farm first.");
      return redirect('/farm-selection');
    }
    const { users } = await LoadFarmUsers();
    const { roles } = await LoadRolesWithPermissions();
    return { users, roles, currentFarm };
  },
  element: <UserRoleManagementPage />
},
{
  path: '/analytics/sales-profit-loss',
  loader: async ({ request }: { request: Request }) => {
    const authenticated: boolean = await Authenticated();
    if (!authenticated) {
      toast.error("You must be logged in to access this page.");
      return redirect('/login');
    }
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date') || undefined;
    const endDate = url.searchParams.get('end_date') || undefined;
    return LoadSalesProfitLossData(startDate, endDate);
  },
  element: <SalesProfitLossPage />
}


]

const routes  = exportRoutes("poultry" ,  PoultryRoutes);

export  default routes;