import { Calendar, Layers, Thermometer, Warehouse } from "lucide-react"
import { Card } from "../ui/card"
import { useEffect, useState } from "react"
import { getWeather } from "@/lib/request"
import type { FarmStatsDataType, WeatherDataType } from "@/lib/types"
import { formatCount, getWeatherIcon } from "@/lib/utils"
import StatisticsCard from "../general/StatisticsCard"

const FarmStat = ({
  statistics,
  farmName,
}: {
  statistics: FarmStatsDataType | null
  farmName?: string
}) => {
  const [weatherData, setWeatherData] = useState<WeatherDataType>()
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const getData = async () => {
      const resolvedData = await getWeather()
      if (resolvedData && resolvedData.temp !== "") {
        setWeatherData(resolvedData)
      } else {
        setFailed(true)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const weekday = new Date().toLocaleDateString(undefined, { weekday: "long" })
  const dateLabel = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const feedKg = Number(statistics?.total_feed_inventory ?? 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatisticsCard
        cardStyles="h-44 border-slate-200 bg-white shadow-none"
        title="Total flocks"
        value={formatCount(statistics?.total_flocks ?? 0)}
        footer="Across all houses"
        footerIcon={<Layers className="mr-1 h-3 w-3" />}
        icon={<Layers className="h-5 w-5 text-teal-600" />}
        iconStyles="bg-teal-50"
      />

      <StatisticsCard
        cardStyles="h-44 border-slate-200 bg-white shadow-none"
        title="Feed inventory"
        value={`${formatCount(feedKg)} kg`}
        footer="On hand across batches"
        footerIcon={<Calendar className="mr-1 h-3 w-3" />}
        icon={<Warehouse className="h-5 w-5 text-sky-600" />}
        iconStyles="bg-sky-50"
      />

      <StatisticsCard
        cardStyles="h-44 border-slate-200 bg-white shadow-none"
        title="Poultry houses"
        value={formatCount(statistics?.total_poultry_houses ?? 0)}
        footer="Pens / houses registered"
        footerIcon={null}
        icon={<Warehouse className="h-5 w-5 text-amber-600" />}
        iconStyles="bg-amber-50"
      />

      <Card className="h-44 overflow-hidden border-slate-200 bg-white px-4 shadow-none hover:shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {farmName ?? "Farm"}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{weekday}</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <h2 className="mt-1 text-3xl font-bold text-foreground">
              {weatherData?.temp ?? "—"}° C
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Thermometer className="mr-1 h-3 w-3" />
                High: {weatherData?.temp_max ?? "—"}° Low: {weatherData?.temp_min ?? "—"}°
              </span>
            </p>
            {loading && <p className="text-xs text-muted-foreground">Loading weather…</p>}
            {failed && <p className="text-xs text-red-500">Weather unavailable</p>}
          </div>
          <div className="flex flex-col items-end">
            <div className="rounded-full p-2">
              <div className="h-5 w-5">{getWeatherIcon(weatherData?.id ?? 300).icon}</div>
            </div>
            <p className="mt-2 text-xs font-medium">{weatherData?.description ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              Feels like {weatherData?.feels_like ?? "—"}°
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FarmStat
