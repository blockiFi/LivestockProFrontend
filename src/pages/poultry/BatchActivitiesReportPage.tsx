import { Link, useLoaderData } from "react-router-dom"
import { CalendarRange, ChevronRight } from "lucide-react"

import BatchActivitiesReportView from "@/components/poultry/Flocks/BatchActivitiesReportView"
import type { DetailedFlockRecord } from "@/lib/types"

export default function BatchActivitiesReportPage() {
  const { Flock: flock } = useLoaderData() as { Flock: DetailedFlockRecord }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link
              to="/dashboard/poultry/flock-management"
              className="hover:text-gray-800 transition-colors"
            >
              Flock Management
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              to={`/dashboard/poultry/flock-management/${flock.id}`}
              className="hover:text-gray-800 transition-colors"
            >
              {flock.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-800 font-medium">Activity Report</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarRange className="h-7 w-7 text-indigo-600 shrink-0" />
            Batch Activity Report
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {flock.name}
            {flock.batch_number && (
              <span>
                {" "}
                · Batch <span className="font-semibold">{flock.batch_number}</span>
              </span>
            )}
          </p>
        </div>

        <BatchActivitiesReportView flock={flock} />
      </div>
    </div>
  )
}
