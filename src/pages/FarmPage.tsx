import { useLoaderData } from 'react-router'
import type { Farm } from "@/lib/types";
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
    ArrowUpRight,
    Bell,
    Calendar,
    ChevronRight,
    CloudSun,
    Droplet,
    Fish,
    Layers,
    PiggyBank,
    Plus,
    Search,
    Thermometer,
    Tractor,
  } from "lucide-react"
  
  import { Button } from "@/components/ui/button"
  import { Card, CardContent } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatisticsCard from '@/components/general/StatisticsCard';
import FarmStat from '@/components/Farm/FarmStat';
import type { getFarmStatsResponseData } from '@/lib/interfaces';


const FarmPage = () => {
   const {currentFarm ,  farmStats} = useLoaderData() as { currentFarm?: Farm  , farmStats : getFarmStatsResponseData };
   const CurrentUser = useSelector((state : RootState) => state.authentication.user);
    console.log(currentFarm?.name);
  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Good Morning, {CurrentUser!.name}!</h1>
          <p className="text-muted-foreground">Optimize your farm operations with real-time insights</p>
        </div>
        {
            farmStats.success &&
            <FarmStat  statistics = {farmStats.data ?? null}/>
        }
       
        <div className='flex justify-between items-center w-full gap-3'>
       
          <Card className="h-96  hover:shadow-lg w-full">
          
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {/* <RecentActivities /> */}
            </CardContent>
          </Card>

          <Card className="h-96 w-full hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Task Management</h3>
                <Button  size="sm" className="bg-primary-300 gap-1  text-white">
                  Add New Task <Plus className="h-4 w-4" />
                </Button>
              </div>
              {/* <TaskList /> */}
            </CardContent>
          </Card>
        </div>
        <div className='flex justify-between items-center w-full gap-3'>
       
       <Card className="h-96  hover:shadow-lg w-full">
       
         <CardContent className="p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold">Recent Activities</h3>
             <Button variant="ghost" size="sm" className="gap-1">
               View all <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
           {/* <RecentActivities /> */}
         </CardContent>
       </Card>

       <Card className="h-96 w-full hover:shadow-lg">
         <CardContent className="p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold">Task Management</h3>
             <Button  size="sm" className="bg-primary-300 gap-1  text-white">
               Add New Task <Plus className="h-4 w-4" />
             </Button>
           </div>
           {/* <TaskList /> */}
         </CardContent>
       </Card>
     </div>

        
    </main>
  )
}

export default FarmPage
