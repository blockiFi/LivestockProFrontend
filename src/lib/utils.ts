import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LoaderFunctionArgs } from "react-router-dom"
import type { route } from "./interfaces";
import { requireRoutePermission } from "./loader";

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
export const formatCurrency = (value: number): string => {
  const numeric = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

/** Integer counts (birds, eggs, flocks, mortality) without forced decimals. */
export const formatCount = (value: number): string => {
  const numeric = Number.isFinite(value) ? Math.round(value) : 0
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(numeric)
}

/** Currency with Naira symbol. */
export const formatMoney = (value: number): string => {
  return `${Naira}${formatCurrency(value)}`
}

/** Safe division — returns null instead of NaN when denominator is 0. */
export const safeRatio = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null
  }
  return numerator / denominator
}

export type ExpiryStatus = "expired" | "expiring_soon" | "ok" | "unknown"

/** Classify an expiry date relative to today. */
export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return "unknown"

  const exp = new Date(expiryDate)
  if (isNaN(exp.getTime())) return "unknown"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDay = new Date(exp)
  expDay.setHours(0, 0, 0, 0)

  if (expDay < today) return "expired"

  const soonThreshold = new Date(today)
  soonThreshold.setDate(soonThreshold.getDate() + 30)
  if (expDay <= soonThreshold) return "expiring_soon"

  return "ok"
}

export const exportRoutes = (prefix: string, routes: route[]) => {
  return routes.map((route) => {
    const routePath = route.path.startsWith("/") ? route.path : `/${route.path}`
    const originalLoader = route.loader

    return {
      ...route,
      path: prefix + routePath,
      loader: async (args: LoaderFunctionArgs) => {
        const pathname = new URL(args.request.url).pathname
        await requireRoutePermission(pathname)
        if (originalLoader) {
          return originalLoader(args)
        }
        return null
      },
    }
  })
}

export const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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

export function isFlockActive(status: string): boolean {
  return status === "active"
}

/** Calendar days from batch arrival to end (or today if still active). */
export function getDaysInFlock(
  arrivalDate: string,
  actualEndDate?: string | null,
  isActive = true
): number {
  const start = new Date(arrivalDate)
  start.setHours(0, 0, 0, 0)

  const end = !isActive && actualEndDate ? new Date(actualEndDate) : new Date()
  end.setHours(0, 0, 0, 0)

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
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