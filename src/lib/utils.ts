import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { route } from "./interfaces";
import type {  eggProductionDataType, feedConsumptionDataType, mortalityDataType, PoultryBreakDownReportRequestType, PoultryDashboardData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const  Naira = "₦"
export const weatherIcons = [
  // Thunderstorm (200-299)
  { codes: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232], icon: "⚡", style: "bg-yellow-300" },
  
  // Drizzle (300-399)
  { codes: [300, 301, 302, 310, 311, 312, 313, 314, 321], icon: "🌦️", style: "bg-blue-300" },
  
  // Rain (500-599)
  { codes: [500, 501, 502, 503, 504, 511, 520, 521, 522, 531], icon: "🌧️", style: "bg-blue-400" },
  
  // Snow (600-699)
  { codes: [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622], icon: "❄️", style: "bg-blue-200" },
  
  // Atmosphere (700-799)
  { codes: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781], icon: "🌫️", style: "bg-gray-200" },
  
  // Clear (800)
  { codes: [800], icon: "☀️", style: "bg-yellow-400" },
  
  // Clouds (801-899)
  { codes: [801, 802, 803, 804], icon: "☁️", style: "bg-gray-500" },
];

// Function to get weather icon based on weather ID
export const getWeatherIcon = (weatherId: number) => {
  const weatherIcon = weatherIcons.find(item => 
    item.codes.includes(weatherId)
  );
  return weatherIcon || { icon: "🌤️", style: "text-gray-400" }; // default fallback
};
export const  formatCurrency = (value : number) : string => {
  return  new Intl.NumberFormat('ja-JP' ).format(
    value,
  )
} 

export const exportRoutes = (prefix: string, routes: route[]) => {
  return routes.map(route => ({
    ...route,
    path: prefix + (route.path.startsWith("/") ? route.path : "/" + route.path)
  }));
};

export const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export const  getPoultryBreakDownReport = async (statistics : PoultryDashboardData) : Promise<PoultryBreakDownReportRequestType> => {


  let eggProductionData  : eggProductionDataType[] = [];
  statistics.egg_production.daily_breakdown?.map((record) => {
    eggProductionData.push({
        date : record.date,
        eggs : record.eggs_produced
    });

  })
 
  let mortalityData  : mortalityDataType[] = [];
  statistics.mortality.daily_breakdown?.map((record) => {
    mortalityData.push({
        date : record.date,
        mortality : record.mortality_count,
        rate : record.mortality_rate_percent
    });

  })

  let feedConsumptionData  : feedConsumptionDataType[] = [];
  statistics.feed_consumption.daily_breakdown?.map((record ) => {
    feedConsumptionData.push({
        date : record.date,
        feed_kg : record.total_feed_kg,
        cost :  record.total_feed_kg  * statistics.feed_consumption.total_feed_cost /  statistics.feed_consumption.total_feed_consumed_kg
    });

  })

  return {
    eggProductionData ,
    mortalityData,
    feedConsumptionData
  }
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const  formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export const statusColors  = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  terminated: "bg-red-100 text-red-800 border-red-200",
} 

export const houseStatusColors = {
  Active: "bg-green-100 text-green-800",
  Maintenance: "bg-yellow-100 text-yellow-800",
  Inactive: "bg-gray-100 text-gray-800",
}