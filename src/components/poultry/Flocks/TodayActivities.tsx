import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetailedFlockRecord } from "@/lib/types";
import { CalendarClock, Pill, Shield, Wheat, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { coversFeedingDay } from "@/lib/feeding-range";

interface TodayActivitiesProps {
  flock: DetailedFlockRecord;
}

const TodayActivities = ({ flock }: TodayActivitiesProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const arrivalDate = new Date(flock.arrival_date);
  const now = new Date();
  const daysSinceArrival = Math.floor(
    (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentAge = flock.arrival_age_days + daysSinceArrival;
  // Feeding day is placement-based: Day 1 = arrival date
  const currentFeedingDay = daysSinceArrival + 1;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const todayMedications = useMemo(() => {
    const items = [];
    for (const batch of flock.batch_medication_schedules ?? []) {
      const scheduleItems = batch.schedule?.items ?? [];
      const match = scheduleItems.find(item => item.age_days === currentAge);
      if (match) items.push(match);
    }
    return items;
  }, [flock.batch_medication_schedules, currentAge]);

  const todayVaccinations = useMemo(() => {
    const items = [];
    for (const batch of flock.batch_vaccination_schedules ?? []) {
      const scheduleItems = batch.schedule?.items ?? [];
      const match = scheduleItems.find(item => item.age_days === currentAge);
      if (match) items.push(match);
    }
    return items;
  }, [flock.batch_vaccination_schedules, currentAge]);

  // Gather all feeding items for today, flattening feeding_times array
  const todayFeedings = useMemo(() => {
    const feedingSlots: any[] = [];
    for (const batch of flock.batch_feeding_schedules ?? []) {
      const scheduleItems = batch.schedule?.items ?? [];
      const batchItems = batch.items ?? [];
      
      // Find ranges that cover today's placement day
      const matches = scheduleItems.filter((item) =>
        coversFeedingDay(item, currentFeedingDay)
      );
      for (const match of matches) {
        // Check if there's an executed batch item with actual_feeding_time
        const executedItem = batchItems.find(
          (ei: any) => ei.feeding_schedule_item_id === match.id
        );
        
        // Use actual_feeding_time if available, otherwise use feeding_times
        const feedingTimes = executedItem?.actual_feeding_time 
          ? (typeof executedItem.actual_feeding_time === 'string' 
              ? JSON.parse(executedItem.actual_feeding_time) 
              : executedItem.actual_feeding_time)
          : (match.feeding_times || []);
        
        // Flatten each time slot into a separate entry
        if (Array.isArray(feedingTimes) && feedingTimes.length > 0) {
          feedingTimes.forEach((timeSlot: any) => {
            feedingSlots.push({
              ...match,
              batch,
              time: timeSlot.time,
              percentage: timeSlot.percentage,
              feedName: match.feed_type?.name || 'Feed',
              quantityPerBird: match.quantity, // in grams per bird
            });
          });
        }
      }
    }
    // Sort by time
    return feedingSlots.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [flock.batch_feeding_schedules, currentFeedingDay]);

  const totalActivities = todayMedications.length + todayVaccinations.length + todayFeedings.length;

  return (
    <Card className="mb-6 border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg shadow-xs">
              <CalendarClock className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-semibold text-gray-900">
                Today's Activities
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                {now.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                {totalActivities} {totalActivities === 1 ? "task" : "tasks"}
              </Badge>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex items-center gap-1">
                <Pill className="h-3 w-3 text-purple-600" />
                {todayMedications.length}
              </Badge>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-600" />
                {todayVaccinations.length}
              </Badge>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex items-center gap-1">
                <Wheat className="h-3 w-3 text-green-600" />
                {todayFeedings.length}
              </Badge>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isExpanded ? "block" : "hidden"} pt-0`}>
        {totalActivities === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-gray-100 rounded-full">
              <CalendarClock className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              No scheduled activities for today
            </p>
            <p className="text-xs text-gray-400">
              All caught up! Check the Schedule view for upcoming tasks.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Medication Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-purple-100 rounded-md">
                <Pill className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Medication</h3>
              <Badge variant="outline" className="ml-auto text-xs">
                {todayMedications.length}
              </Badge>
            </div>
            {todayMedications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No medications today</p>
            ) : (
              todayMedications.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-lg border bg-purple-50/50 hover:bg-purple-50 transition-colors space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-medium text-gray-800 leading-tight">
                      {item.name || "Medication"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {item.dosage && (
                      <span>
                        Dose: <span className="font-medium text-gray-700">{item.dosage} {item.dose_unit || ""}</span>
                      </span>
                    )}
                    {item.quantity && (
                      <span>
                        Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Vaccination Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-blue-100 rounded-md">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Vaccination</h3>
              <Badge variant="outline" className="ml-auto text-xs">
                {todayVaccinations.length}
              </Badge>
            </div>
            {todayVaccinations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No vaccinations today</p>
            ) : (
              todayVaccinations.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-lg border bg-blue-50/50 hover:bg-blue-50 transition-colors space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-medium text-gray-800 leading-tight">
                      {item.name || "Vaccination"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {item.dosage && (
                      <span>
                        Dose: <span className="font-medium text-gray-700">{item.dosage} {item.dose_unit || ""}</span>
                      </span>
                    )}
                    {item.quantity && (
                      <span>
                        Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Feeding Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-2 bg-green-100 rounded-md">
                <Wheat className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Feeding Schedule</h3>
              <Badge variant="outline" className="ml-auto text-xs">
                {todayFeedings.length} {todayFeedings.length === 1 ? 'time' : 'times'}
              </Badge>
            </div>
            {todayFeedings.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No feedings scheduled today</p>
            ) : (
              <div className="flex flex-col gap-3">
                {todayFeedings.map((item: any, idx: number) => {
                  // Calculate quantity in kg: (quantity_per_bird * flock_count * percentage) / 100 / 1000
                  // quantity_per_bird is in grams, so divide by 1000 to get kg
                  const percent = Number(item.percentage) || 0;
                  const flockCount = flock.actual_quantity || 0;
                  const quantityPerBirdGrams = Number(item.quantityPerBird) || Number(item.quantity) || 0;
                  
                  // Quantity for this time slot in kg
                  const quantityKg = ((quantityPerBirdGrams * flockCount * percent) / 100 / 1000).toFixed(2);
                  
                  // Quantity per bird for this time slot in grams
                  const quantityPerBirdForSlot = ((quantityPerBirdGrams * percent) / 100).toFixed(1);
                  
                  // Format time for display
                  const timeStr = item.time || 'N/A';
                  const formattedTime = timeStr !== 'N/A' 
                    ? new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })
                    : 'N/A';
                  
                  return (
                    <div
                      key={`${item.id || idx}-${item.time || idx}`}
                      className="group relative rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/30 hover:border-green-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Time Badge - Prominent */}
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <Clock className="h-3 w-3" />
                        {formattedTime}
                      </div>
                      
                      <div className="pt-8 px-4 pb-3 flex flex-col gap-3">
                        {/* Feed Name */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wheat className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-gray-800">
                              {item.feedName}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            {percent}%
                          </Badge>
                        </div>
                        
                        {/* Quantity Display - Prominent */}
                        <div className="flex items-baseline gap-2 bg-white rounded-lg px-3 py-2.5 border border-green-100 shadow-sm">
                          <span className="text-xs text-gray-500 font-medium">Quantity:</span>
                          <span className="text-xl font-bold text-green-700">{quantityKg}</span>
                          <span className="text-sm text-gray-600 font-medium">kg</span>
                          <span className="ml-auto text-xs text-gray-400">
                            ({flockCount.toLocaleString()} {flockCount === 1 ? 'bird' : 'birds'})
                          </span>
                        </div>
                        
                        {/* Additional Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-green-100">
                          <span>{quantityPerBirdForSlot}g per bird</span>
                          <span className="text-green-600 font-medium">
                            {percent}% of daily feed
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayActivities;
