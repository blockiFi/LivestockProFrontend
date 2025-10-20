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
import {  CalendarIcon, LoaderCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
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
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogDescription>
          Choose a date range to filter the dashboard data. This will update all charts and metrics.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col space-y-4 py-4">
        <div className="space-y-2">
          <Label>Date Range</Label>
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
        {dateRange?.from && dateRange?.to && (
          <div className="rounded-lg bg-muted p-3">
            <div className="text-sm font-medium">Selected Range:</div>
            <div className="text-sm text-muted-foreground">
              {format(dateRange.from, "MMMM dd, yyyy")} - {format(dateRange.to, "MMMM dd, yyyy")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Duration:{" "}
              {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleApplyDateRange}>Apply Filter</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}

export default OverviewDateChange
