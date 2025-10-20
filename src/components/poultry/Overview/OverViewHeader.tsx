
import { Badge } from "@/components/ui/badge"

import { formatCurrency } from '@/lib/utils';
import OverviewDateChange from '../dialog/OverviewDateChange';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {  Menu } from 'lucide-react';
import { useState } from 'react';

const OverViewHeader = () => {
const statistics = useSelector((state : RootState) => state.statistics.poultryStatistics);
const token = useSelector((state : RootState) => state.authentication.token);
const farmId = useSelector((state : RootState) => state.authentication.activeFarm?.id);
const [showDateSelectButton , SetShowDateSelectButton] = useState(false)


  return (
   
    <>
    {
      statistics ? (
        
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Poultry Farm Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Report for {formatCurrency(statistics.summary.total_birds)} birds across{" "}
              {statistics.summary.total_flocks} flocks , form :
        
            </p>
            <p className='text-gray-600 mt-1 text-xs'>
              {new Date(statistics.summary.date_range.start_date).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })} to {new Date(statistics.summary.date_range.end_date).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {showDateSelectButton ? (
              token && farmId ? (
                <OverviewDateChange token={token} farmId={farmId} />
              ) : (
                <p className="text-red-500">Please login to change date range</p>
              )
            ) : (
              <span> <Menu onClick={() => SetShowDateSelectButton(true)}/> </span>
            )}
          
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {statistics.summary.active_flocks} Active Flock
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {statistics.summary.date_range.period_days} Days Period
            </Badge>
          </div>
        </div>


      </div>
      ) : (
        <p>Loading...</p>
      )
    }
    </>
  )
}

export default OverViewHeader
