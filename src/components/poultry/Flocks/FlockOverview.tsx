import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DetailedFlockRecord } from "@/lib/types"
import { formatDate, getDaysInFlock, statusColors } from "@/lib/utils"
import chicken from "@/assets/chicken.png"
import { Calendar, Info } from "lucide-react"

const FlockOverview = ({ flock }: { flock: DetailedFlockRecord }) => {
  const daysInFlock = getDaysInFlock(
    flock.arrival_date,
    flock.actual_end_date,
    flock.status === "active"
  )
  const isOverdue = flock.status === "active" && new Date() > new Date(flock.expected_end_date)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{flock.name}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium"><span className="text-orange-400">Batch:</span>  {flock.batch_number}</span>
              <span>•</span>
              <span><span className="text-orange-400">Breed:</span> {flock.breed}</span>
              <span>•</span>
              <span><span className="text-orange-400">Source:</span> {flock.source}</span>
            </div>
           </div>
          <Badge className={`${statusColors[flock.status as keyof typeof statusColors]} font-medium text-sm px-3 py-1`}>
            {flock.status.charAt(0).toUpperCase() + flock.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <img src={chicken} className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold">{flock.poultry_type.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
                <img src={chicken} className="h-5 w-5 text-blue-600" />

            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-semibold">{flock.actual_quantity.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Days in Flock</p>
              <p className="font-semibold">{daysInFlock} days</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Arrival</p>
              <p className="font-semibold text-sm">{formatDate(flock.arrival_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-100" : "bg-gray-100"}`}>
              <Calendar className={`h-5 w-5 ${isOverdue ? "text-red-600" : "text-gray-600"}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expected End</p>
              <p className={`font-semibold text-sm ${isOverdue ? "text-red-600" : ""}`}>
                {formatDate(flock.expected_end_date)}
              </p>
            </div>
          </div>

          {flock.actual_end_date && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual End</p>
                <p className="font-semibold text-sm">{formatDate(flock.actual_end_date)}</p>
              </div>
            </div>
          )}
        </div>

        {flock.notes && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Notes</p>
                <p className="text-sm text-blue-700">{flock.notes}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FlockOverview
