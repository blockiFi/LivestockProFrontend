import { ArrowUpRight, Calendar, Droplet, Layers, Thermometer, Tractor } from "lucide-react"
import { Card } from "../ui/card"
import {  useEffect, useState } from "react"

import { getWeather } from "@/lib/request"
import type { FarmStatsDataType, WeatherDataType } from "@/lib/types"
import { formatCurrency, getWeatherIcon } from "@/lib/utils"
import StatisticsCard from "../general/StatisticsCard"
const FarmStat = ({statistics} : {statistics : FarmStatsDataType | null}) => {
    const [weatherData , SetWeatherData] = useState<WeatherDataType>();
    const [loading , SetLoading] = useState<boolean>(true);
    const [failed , SetFailed ] = useState<boolean>(false);
  
    useEffect( () => {
        const getData = async ()  => {
            const data = getWeather();
            const resolvedData = await data;
            if(resolvedData && resolvedData.temp !== ""){
                SetWeatherData(resolvedData);
            }else{
                SetFailed(true);
            }
                SetLoading(false); 
             }   
            
             getData();     
    }, [])
    
  return (
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <StatisticsCard
    cardStyles="h-44"
     title="Total Livestock"  
     value={formatCurrency(statistics?.total_flocks ?? 0)}
     footer=" 3.2% from last month"
     footerIcon={<ArrowUpRight className="h-3 w-3 mr-1" />}
     icon = { <Layers className="h-5 w-5 text-primary-500 hover:w-7 hover:h-7" />}
     iconStyles="bg-primary-200"
     />


<StatisticsCard
    cardStyles="h-44"
     title="Feed Inventory"  
     value={`${statistics?.total_feed_inventory} tons`}
     footer="15 days remaining"
     footerIcon={<Calendar className="h-3 w-3 mr-1" />}
     icon = {<Tractor className="h-5 w-5 text-secondary-500 hover:w-7 hover:h-7" />}
     iconStyles="bg-secondary-200"
     />
     
     <StatisticsCard
    cardStyles="h-44"
     title="Total Pen"  
     value={`${statistics?.total_poultry_houses} L`}
     footer="Today's consumption"
     footerIcon={<Droplet className="h-3 w-3 mr-1" />}
     icon = {<Droplet className="h-5 w-5 text-primary-500 hover:w-7 hover:h-7" />}
     iconStyles="bg-primary-200"
     />
     
    
  

<Card className="h-44 px-4 hover:shadow-xl overflow-hidden">
<div className="flex justify-between items-start">
  <div>
    <div className="flex items-center">
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-200 text-primary-700">Chicago</span>
    </div>
    <div className="mt-2">
      <p className="text-sm text-muted-foreground">Monday</p>
      <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    </div>
    <h2 className="text-3xl font-bold text-foreground mt-1"> {weatherData?.temp ?? 0}° C</h2>
    <p className="text-xs text-muted-foreground mt-1">
      <span className="flex items-center">
        <Thermometer className="h-3 w-3 mr-1" /> High: {weatherData?.temp_max ?? 0}° Low: {weatherData?.temp_min}°
      </span>
    </p>
    { loading &&  <p className="text-xs text-muted-foreground">Loading weather data...</p> }
    { failed &&  <p className="text-xs text-red-500">Error Loading WeatherData</p>}
  </div>
  <div className="flex flex-col items-end">
    <div className={`p-2  rounded-full`}>
      {/* <CloudSun className="h-5 w-5 text-secondary-500 hover:w-7 hover:h-7" /> */}
      <div className={` h-5 w-5 hover:w-7 hover:h-7" `} >{getWeatherIcon(weatherData?.id ?? 300).icon}</div>
    </div>
    <p className="text-xs font-medium mt-2">{weatherData?.description ?? "Sunny"}</p>
    <p className="text-xs text-muted-foreground">Feels like {weatherData?.feels_like ?? 0}°</p>
       
        

  </div>
</div>
</Card>
</div>
  )
}

export default FarmStat
