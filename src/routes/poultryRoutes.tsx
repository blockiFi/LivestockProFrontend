import type { getFarmStatsResponseData, LoadFlockDataType, LoadPoultryOverviewDataType } from "@/lib/interfaces";
import { Authenticated, LoadFarmData, LoadFlockData, LoadPoultryOverviewData } from "@/lib/loader";
import type { DetailedFlockRecord } from "@/lib/types";
import { exportRoutes } from "@/lib/utils";
import FlockManagementPage from "@/pages/poultry/FlockManagementPage";
import FlockPage from "@/pages/poultry/FlockPage";
import OverviewPage from "@/pages/poultry/OverviewPage";
import ScheduleManagementPage from "@/pages/poultry/ScheduleManagementPage";
import path from "path";
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
}
]

const routes  = exportRoutes("poultry" ,  PoultryRoutes);

export  default routes;