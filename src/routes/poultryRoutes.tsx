import type { LoadPoultryOverviewDataType } from "@/lib/interfaces";
import { Authenticated, LoadFeedinVentories, LoadFlockData, LoadMedicationData, LoadMedicationInventories, LoadPermissionGroups, LoadPoultryOverviewData, LoadRolesWithPermissions, LoadVaccineData, LoadVaccineInventories } from "@/lib/loader";
import type { DetailedFlockRecord } from "@/lib/types";
import { exportRoutes } from "@/lib/utils";
import FlockManagementPage from "@/pages/poultry/FlockManagementPage";
import FlockPage from "@/pages/poultry/FlockPage";
import OverviewPage from "@/pages/poultry/OverviewPage";
import ScheduleManagementPage from "@/pages/poultry/ScheduleManagementPage";
import MedicationsPage from "@/pages/poultry/health/MedicationsPage";
import MedicationProductsPage from "@/pages/poultry/health/MedicationProductsPage";
import VaccinationsPage from "@/pages/poultry/health/VaccinationsPage";
import VaccinationProductsPage from "@/pages/poultry/health/VaccinationProductsPage";
import { redirect } from "react-router-dom";
import { toast } from "react-toastify";
import MedicationInventoriesPage from "@/pages/poultry/inventory/MedicationInventoriesPage";
import VaccinationInventoriesPage from "@/pages/poultry/inventory/VaccinationInventoriesPage";
import FeedInventoriesPage from "@/pages/poultry/inventory/FeedInventoriesPage";
import PermissionManagementPage from "@/pages/poultry/permission/permissionManagementPage";
import RoleManagementPage from "@/pages/poultry/permission/roleManagementPage";
import UserRoleManagementPage from "@/pages/poultry/permission/userRoleManagementPage";

const PoultryRoutes = [
    {
        path: "/",
        loader : async () : Promise<LoadPoultryOverviewDataType> =>{
            const {PoultryStatistics , currentFarm } = await LoadPoultryOverviewData();

            return {PoultryStatistics , currentFarm};
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
        path: "/flock-management/:flockId",
        loader: async ({params } : {params :{flockId : number}}) : Promise<{Flock : DetailedFlockRecord}> => {

            console.log("Flock ID: ", params.flockId);
           const { Flock } = await LoadFlockData(params.flockId);
              if(Flock === null){
                throw new Error("Flock not found");
              }
              console.log(Flock)
              return { Flock };
    },
    element : <FlockPage />
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
     const { vaccines } = await LoadVaccineData();
    return { vaccines };
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
    return null
  },
  element: <UserRoleManagementPage />
}


]

const routes  = exportRoutes("poultry" ,  PoultryRoutes);

export  default routes;