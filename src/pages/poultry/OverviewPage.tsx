import OverViewHeader from "@/components/poultry/Overview/OverViewHeader";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Bird, Egg, DollarSign, Scale } from "lucide-react"
import { formatCurrency, Naira } from "@/lib/utils";
import StatisticsCard from "@/components/general/StatisticsCard";
import { useState } from "react";
import Overview from "@/components/poultry/Overview/Overview";
import ProductionOverview from "@/components/poultry/Overview/ProductionOverview";
import HealthOverview from "@/components/poultry/Overview/HealthOverview";
import FinancialOverview from "@/components/poultry/Overview/FinancialOverview";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

const OverviewPage = () => {
    const [selectedTab, setSelectedTab] = useState("overview")
    
          const PoultryStatistics = useSelector((state : RootState) => state.statistics.poultryStatistics);     
    console.log("farm Stats from Overview Page : " , PoultryStatistics)
  return (
    <>
      {
        PoultryStatistics ? (
         <div className="min-h-screen p-4 md:p-6 lg:p-8">
        {
            PoultryStatistics &&  <OverViewHeader  />
        }
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
     <StatisticsCard 
        cardStyles=""
        title = "Total Birds"
        value={formatCurrency(PoultryStatistics!.summary.total_birds)}
        footerIcon={null}
        footer={`${formatCurrency(PoultryStatistics!.summary.active_birds)} currently active`}
        icon={<Bird className="h-4 w-4 text-accent-600" />}
        iconStyles=""
     />
    <StatisticsCard 
        cardStyles="px-4"
        title="Feed Consumed"
        value={`${formatCurrency(PoultryStatistics!.feed_consumption.total_feed_consumed_kg / 1000)}tons`}
        footerIcon={null}
        footer={`${PoultryStatistics!.feed_consumption.average_daily_feed_kg} kg/day average`}
        icon={<Scale className="h-4 w-4 text-green-300" />}
        iconStyles=""
    />
    <StatisticsCard 
        cardStyles=""
        title="Total Eggs"
        value={formatCurrency(PoultryStatistics!.egg_production.total_eggs_produced)}
        footerIcon={null}
        footer={`${PoultryStatistics!.egg_production.average_daily_eggs} eggs/day average`}
        icon={<Egg className="h-4 w-4 text-accent-700" />}
        iconStyles=""
    />
    <StatisticsCard 
        cardStyles="w-66"
        title="Feed Cost"
        value={`${Naira}${formatCurrency(PoultryStatistics!.financial.total_feed_cost)}`}
        footerIcon={null}
        footer={`${formatCurrency(PoultryStatistics!.financial.cost_per_bird)} per bird`}
        icon={<DollarSign className="h-4 w-4 text-green-500" />}
        iconStyles=""
    />
    </div>

    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 mt-5">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {PoultryStatistics ? <Overview  /> : 
             <div className="text-center text-gray-500">No overview data available</div>}
          </TabsContent>
          <TabsContent value="production" className="space-y-4">
            {/* Production Overview Component */}
            {PoultryStatistics ?  <ProductionOverview  /> : 
             <div className="text-center text-gray-500">No production data available</div>
             }
          </TabsContent>
          <TabsContent value="health" className="space-y-4">
            {PoultryStatistics  ? <HealthOverview  /> :
             <div className="text-center text-gray-500">No health data available</div>
             }  
          </TabsContent>
          <TabsContent value="financial" className="space-y-4">
            {PoultryStatistics ?
             <FinancialOverview  /> :
             
             <div className="text-center text-gray-500">No financial data available</div>}

          </TabsContent>

    </Tabs>
    </div>

        ) : (
          <div className="container mx-auto p-4 text-center">Loading...</div>
        )
      }
    </>    
  )
}

export default OverviewPage
