import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DetailedFlockRecord } from "@/lib/types"
import { formatDate, statusColors } from "@/lib/utils"
import chicken from "@/assets/chicken.png"
import { Calendar, Info } from "lucide-react"
function calculateAge(arrivalDate: string, ageAtArrival: number): number {
  const arrival = new Date(arrivalDate)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
  return ageAtArrival + daysDiff
}
const FlockOverview = ({ flock }: { flock: DetailedFlockRecord }) => {
// Calculate current age or days spent if completed
let currentAge: number
if (flock.status === "completed" && flock.actual_end_date) {
    const arrival = new Date(flock.arrival_date)
    const end = new Date(flock.actual_end_date)
    const daysSpent = Math.floor((end.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
    currentAge = flock.arrival_age_days + daysSpent
} else {
    currentAge = calculateAge(flock.arrival_date, flock.arrival_age_days)
}
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
              <p className="font-semibold">{flock.quantity.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {
                flock.status === "completed"
                  ? "Days Spent"
                  : "Current Age"
                }
              </p>
              <p className="font-semibold">{currentAge} days</p>
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
