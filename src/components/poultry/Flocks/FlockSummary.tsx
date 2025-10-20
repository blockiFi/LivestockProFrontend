import { Card } from '@/components/ui/card'
import type { RootState } from '@/store';
import { useMemo } from 'react'
import { useSelector } from 'react-redux';
import chicken from "@/assets/chicken.png"

const FlockSummary = () => {
    const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);    
   const stats = useMemo(() => {
      const total = statistics?.summary.total_flocks || 0
      const active = statistics?.summary.active_flocks || 0
      const completed = statistics?.flock_details.filter((f) => f.status === "completed").length || 0
      const planned = statistics?.flock_details.filter((f) => f.status === "sold").length || 0
      const terminated =  statistics?.flock_details.filter((f) => f.status === "culled").length || 0
      const totalQuantity = statistics?.summary.total_birds || 0
      return { total, active, completed, planned, terminated, totalQuantity }
    }, [statistics])
  
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Flocks</p>
          </div>
        </Card>
  
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </Card>
  
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </Card>
  
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.planned}</p>
            <p className="text-xs text-gray-500">Planned</p>
          </div>
        </Card>
  
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.terminated}</p>
            <p className="text-xs text-gray-500">Terminated</p>
          </div>
        </Card>
  
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalQuantity.toLocaleString()}<img /></p>
            <div className="flex items-center justify-center gap-1 mt-1">
            <img src={chicken} alt="Chicken Icon" className="inline-block h-4 w-4 ml-1" />
            <p className="text-xs text-gray-500">Total Birds </p>
            </div>

          </div>
        </Card>
      </div>
    )
}

export default FlockSummary
