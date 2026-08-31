import { Button } from "@/components/ui/button"
import { Bird } from "lucide-react"
import { Link } from "react-router-dom"

type Props = {
  title?: string
  description?: string
}

const DashboardEmptyState = ({
  title = "No dashboard data yet",
  description = "Add flocks and start recording daily feed, eggs, and sales to see your farm command center fill in.",
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-emerald-50 p-3 text-emerald-600">
        <Bird className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      <Button asChild className="mt-6" variant="default">
        <Link to="/dashboard/poultry/flock-management">Go to flock management</Link>
      </Button>
    </div>
  )
}

export default DashboardEmptyState
