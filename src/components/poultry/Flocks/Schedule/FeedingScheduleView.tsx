import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon,
  Clock, 
  Users, 
  Wheat, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  Pause,
  MoreHorizontal,
  Filter,
  Search,
  Plus,
  Edit
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { BatchFeedingSchedule, BatchFeedingScheduleItem } from "@/lib/types";
import { format } from "date-fns";

interface FeedingScheduleViewProps {
  schedules: BatchFeedingSchedule[];
  isLoading?: boolean;
  onCreateSchedule?: () => void;
  onEditSchedule?: (schedule: BatchFeedingSchedule) => void;
  onDeleteSchedule?: (scheduleId: number) => void;
  onUpdateScheduleItem?: (item: BatchFeedingScheduleItem) => void;
}

const FeedingScheduleView: React.FC<FeedingScheduleViewProps> = ({
  schedules,
  isLoading = false,
  onCreateSchedule,
  onEditSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<"cards" | "timeline" | "calendar">("cards");

  // Filter and search schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const matchesSearch = schedule.schedule?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           schedule.schedule?.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
      const matchesDate = !dateFilter || 
                         schedule.items.some(item => 
                           new Date(item.feeding_date).toDateString() === dateFilter.toDateString()
                         );
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [schedules, searchTerm, statusFilter, dateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSchedules = schedules.length;
    const activeSchedules = schedules.filter(s => s.status === 'ongoing').length;
    const completedSchedules = schedules.filter(s => s.status === 'completed').length;
    const upcomingFeedings = schedules.reduce((acc, schedule) => 
      acc + schedule.items.filter(item => item.status === 'scheduled').length, 0
    );
    const overdueFeedings = schedules.reduce((acc, schedule) => 
      acc + schedule.items.filter(item => 
        item.status === 'scheduled' && new Date(item.feeding_date) < new Date()
      ).length, 0
    );

    return {
      totalSchedules,
      activeSchedules,
      completedSchedules,
      upcomingFeedings,
      overdueFeedings
    };
  }, [schedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'ongoing': return <Play className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'missed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Pause className="h-4 w-4" />;
    }
  };

  const FeedingScheduleCard: React.FC<{ schedule: BatchFeedingSchedule }> = ({ schedule }) => {
    const upcomingItems = schedule.items.filter(item => item.status === 'scheduled');
    const completedItems = schedule.items.filter(item => item.status === 'completed');
    const progressPercentage = schedule.items.length > 0 
      ? (completedItems.length / schedule.items.length) * 100 
      : 0;

    return (
      <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg font-semibold">{schedule.schedule?.title}</CardTitle>
                <Badge className={cn("border", getStatusColor(schedule.status))}>
                  {getStatusIcon(schedule.status)}
                  <span className="ml-1 capitalize">{schedule.status}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{schedule.schedule?.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {schedule.schedule?.start_date} - {schedule.schedule?.end_date}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Flock #{schedule.flock_id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEditSchedule?.(schedule)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-600">{schedule.items.length}</div>
              <div className="text-xs text-muted-foreground">Total Items</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-600">{completedItems.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg font-semibold text-yellow-600">{upcomingItems.length}</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
          </div>

          {/* Recent/Upcoming Items */}
          {upcomingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Next Feedings</h4>
              <div className="space-y-2">
                {upcomingItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>{formatDate(item.feeding_date)}</span>
                      <span className="font-medium">{item.actual_quantity}kg</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                ))}
                {upcomingItems.length > 3 && (
                  <div className="text-xs text-center text-muted-foreground">
                    +{upcomingItems.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TimelineView = () => (
    <div className="space-y-6">
      {filteredSchedules.map((schedule) => (
        <div key={schedule.id} className="relative">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                schedule.status === 'completed' ? 'bg-green-500 border-green-500' :
                schedule.status === 'ongoing' ? 'bg-blue-500 border-blue-500' :
                'bg-gray-300 border-gray-300'
              )} />
              {filteredSchedules.indexOf(schedule) !== filteredSchedules.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-200 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <FeedingScheduleCard schedule={schedule} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-muted-foreground">Loading feeding schedules...</span>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Wheat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Feeding Schedules</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first feeding schedule to start managing livestock nutrition.
        </p>
        {onCreateSchedule && (
          <Button onClick={onCreateSchedule} className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Feeding Schedule
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Schedules</p>
                <p className="text-2xl font-bold">{stats.totalSchedules}</p>
              </div>
              <Wheat className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active</p>
                <p className="text-2xl font-bold">{stats.activeSchedules}</p>
              </div>
              <Play className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.completedSchedules}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcomingFeedings}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdueFeedings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="cards">Cards</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
              </Tabs>

              {onCreateSchedule && (
                <Button 
                  onClick={onCreateSchedule}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      <div>
        {viewMode === "timeline" ? (
          <TimelineView />
        ) : (
          <div className="grid gap-4">
            {filteredSchedules.map((schedule) => (
              <FeedingScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}

        {filteredSchedules.length === 0 && schedules.length > 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No matching schedules</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedingScheduleView;
