import type { LoadPoultryOverviewDataType } from "@/lib/interfaces";
import { Authenticated, LoadFlockData, LoadMedicationData, LoadPoultryOverviewData, LoadVaccineData } from "@/lib/loader";
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
  },
  element: <VaccinationProductsPage />
}
]

const routes  = exportRoutes("poultry" ,  PoultryRoutes);

export  default routes;