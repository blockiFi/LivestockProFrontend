import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import {  CalendarIcon, LoaderCircle, CalendarRange, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { toast } from "react-toastify";
import { getPoultryStatistics } from "@/lib/request";
import { setPoultryStatistics } from "@/store/StatisticsSlice";
import store from "@/store";
const OverviewDateChange = ({token , farmId } : {token : string , farmId : number}) => {
    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [loading ,  SetLoading ] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date("2024-12-28"),
        to: new Date("2025-06-28"),
      })


  const handleDateRangeSelect = (range: DateRange | undefined) => {
    
    if(range != undefined){
        setDateRange(range)
    }
    else{
        toast.error("Error Setting Date");
    }
  }

  const handleApplyDateRange = async () => {
    SetLoading(true);
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select a valid date range");
      SetLoading(false);
      return;
    }
    if (dateRange.from > dateRange.to) {
      toast.error("Start date cannot be after end date");
      SetLoading(false);
      return;
    }

    const response =  await getPoultryStatistics(token, farmId, dateRange.from.toISOString(), dateRange.to.toISOString());
    if (!response.success) {
      toast.error(`Error fetching statistics: ${response.error?.join(", ") || "Unknown error"}`);
      SetLoading(false);
      return;
    }
    store.dispatch(setPoultryStatistics(response.data ?? null));

    SetLoading(false);
    toast.success("Date range updated successfully");
    setIsDateDialogOpen(false);
    console.log(dateRange);
  }
  return (
    <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className="gap-2 bg-transparent" disabled={loading}>
      
      <CalendarIcon className="h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
            </>
          ) : (
            format(dateRange.from, "MMM dd, yyyy")
          )
        ) : (
          "Select date range"
        )}
       {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      </Button>
     
      
    </DialogTrigger>
    <DialogContent className="sm:max-w-[650px] p-0">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 rounded-t-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Select Date Range</DialogTitle>
          <DialogDescription className="text-emerald-100">
            Choose a date range to filter the dashboard data. This will update all charts and metrics.
          </DialogDescription>
        </DialogHeader>
      </div>
      <div className="flex flex-col space-y-4 px-6 pb-6">
        {/* Calendar Section */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-emerald-500" />
            Date Range
          </h3>
          <div className="flex justify-center border rounded-lg p-2 bg-white shadow-sm">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              disabled={(date) => date > new Date("2025-06-28") || date < new Date("2024-07-03")}
            />
          </div>
        </div>

        {/* Selected Range Summary */}
        {dateRange?.from && dateRange?.to && (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
            <div className="text-sm font-semibold text-emerald-800 flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Selected Range
            </div>
            <div className="text-sm text-emerald-700 font-medium">
              {format(dateRange.from, "MMMM dd, yyyy")} — {format(dateRange.to, "MMMM dd, yyyy")}
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              Duration:{" "}
              <span className="font-bold">
                {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApplyDateRange} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Apply Filter
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
  )
}

export default OverviewDateChange
