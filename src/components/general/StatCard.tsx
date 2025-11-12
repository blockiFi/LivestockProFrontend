import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: "blue" | "red" | "green" | "purple"
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-600",
    red: "bg-red-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  }

  return (
    <div className={`${colorClasses[color]} rounded-lg p-6 text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-white opacity-80" />
      </div>
    </div>
  )
}
