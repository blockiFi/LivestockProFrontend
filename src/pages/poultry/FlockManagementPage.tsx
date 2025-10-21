import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Calendar,
  MapPin,
  FileText,
  Plus,
} from "lucide-react"
import FlockSummary from "@/components/poultry/Flocks/FlockSummary"
import Pagination from "@/components/general/Pagination"
import { getFlocks, createFlock } from "@/lib/request"
import type { FlockRecord } from "@/lib/types"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import chicken from "@/assets/chicken.png"
import { useNavigate } from "react-router-dom"
import AddFlockModal from "@/components/modals/AddFlockModal"
import { toast } from "react-toastify"

// Types

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  terminated: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  active: "🟢",
  completed: "✅",
  planned: "📅",
  terminated: "❌",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const FlockCard = ({ flock }: { flock: FlockRecord }) =>{
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    const viewFlock = () => {
        navigate(`/dashboard/poultry/flock-management/${flock.id}`)
    }
    return (
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{flock.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{flock.batch_number}</span>
                <span>•</span>
                <span>{flock.breed}</span>
              </div>
            </div>
            <Badge className={`${statusColors[flock.status as keyof typeof statusColors]} font-medium`}>
              {statusIcons[flock.status as keyof typeof statusIcons]} {flock.status.charAt(0).toUpperCase() + flock.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
  
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" onClick={viewFlock}>
            <div className="flex items-center gap-2">
              <img src={chicken} className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="font-semibold">{flock.quantity.toLocaleString()}</p>
              </div>
            </div>
  
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Arrival</p>
                <p className="font-semibold text-sm">{formatDate(flock.arrival_date)}</p>
              </div>
            </div>
  
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">House</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <p className="font-semibold text-sm truncate">{flock.poultry_house.name}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{flock.poultry_house.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
  
            <div>
              <p className="text-xs text-gray-500">Type & Stage</p>
              <p className="font-semibold text-sm">{flock.poultry_type.name}</p>
              <p className="text-xs text-gray-600">{flock.flock_stage.name}</p>
            </div>
          </div>
  
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">{isExpanded ? "Hide Details" : "Show Details"}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
  
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Source</p>
                  <p className="text-sm">{flock.source}</p>
                </div>
  
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Expected End Date</p>
                  <p className="text-sm">{formatDate(flock.expected_end_date)}</p>
                </div>
  
                {flock.actual_end_date && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Actual End Date</p>
                    <p className="text-sm">{formatDate(flock.actual_end_date)}</p>
                  </div>
                )}
  
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm">{formatDate(flock.updated_at)}</p>
                </div>
              </div>
  
              {flock.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-1">Notes</p>
                      <p className="text-sm text-blue-700">{flock.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    )
  }
  
 
  
 
  
 const  FlockManagementPage = () =>{
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [flocks, setFlocks] = useState<FlockRecord[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [uniqueTypes , setUniqueTypes] = useState<string[]>([]);
    const [isAddFlockModalOpen, setIsAddFlockModalOpen] = useState(false);
    const token = useSelector((state: RootState) => state.authentication.token);
    const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
    const PoultryStatistics = useSelector((state : RootState) => state.statistics.poultryStatistics);

    const fetchFlocks = async (page?: number , perPage? : number) => {
        if (!farmId) return;
        const response = await getFlocks(token, farmId, true, page, perPage);
        console.log("Fetched flocks: ", response.data);
        if(response.success){
            console.log("Flocks fetched successfully");
            console.log("Flocks data: ", response);
            setCurrentPage(response.current_page || 1);
            setPerPage(response.per_page || 6);
            setTotalPages(response.total_pages || 1);
            console.log("Total records: ", response.total_pages);
            console.log("Current page: ", response.current_page);
            console.log("Per page: ", response.per_page);
            console.log("Total pages: ", response.total_pages);
         
            setFlocks(response.data || []);
            
        }
    };
    useEffect(() => {
        if(PoultryStatistics && PoultryStatistics.poultry_types && PoultryStatistics.poultry_types.length > 0   ){
            setUniqueTypes(
                Array.from(new Set(PoultryStatistics.poultry_types.map((type) => type.type_name)))
            );  
        }
    }, [PoultryStatistics]);
    useEffect(() => {
      fetchFlocks(currentPage, perPage); // Fetch initial data with default page size

    }, [currentPage, token , perPage, farmId]);       

    const handleCreateFlock = async (flockData: any) => {
        if (!farmId || !token) return;
        
        try {
            const response = await createFlock(token, farmId, flockData);
            if (response.success) {
                console.log("Flock created successfully:", response.data);
                toast.success("Flock created successfully!");
                // Close the modal only on success
                setIsAddFlockModalOpen(false);
                // Refresh the flocks list
                await fetchFlocks(currentPage, perPage);
            } else {
                console.error("Failed to create flock:", response);
                // Handle different error response formats
                let errorMessage = "Unknown error occurred";
                
                // Check if response has a message field (direct API error)
                if ((response as any).message) {
                    errorMessage = (response as any).message;
                } 
                // Check if response has error array
                else if (response.error && Array.isArray(response.error) && response.error.length > 0) {
                    errorMessage = response.error.join(", ");
                }
                // Check if response has single error string
                else if (response.error) {
                    errorMessage = Array.isArray(response.error) ? response.error.join(", ") : response.error;
                }
                
                toast.error(errorMessage);
                // Don't close the modal on error - throw error to prevent modal from closing
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Error creating flock:", error);
            // If it's not our custom error, show generic message
            if (error instanceof Error && error.message !== "Unknown error occurred") {
                // Re-throw our custom error to prevent modal closing
                throw error;
            } else {
                toast.error("An error occurred while creating the flock. Please try again.");
                // Throw error to prevent modal closing
                throw new Error("Network or unexpected error occurred");
            }
        }
    };

    const filteredData = useMemo(() => {
      return flocks.filter((flock) => {
        const matchesSearch =
          flock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flock.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flock.breed.toLowerCase().includes(searchTerm.toLowerCase())
  
        const matchesStatus = statusFilter === "all" || flock.status === statusFilter
        const matchesType = typeFilter === "all" || flock.poultry_type.name === typeFilter
  
        return matchesSearch && matchesStatus && matchesType
      })
    }, [searchTerm, statusFilter, typeFilter , flocks , PoultryStatistics , currentPage, perPage]);
  
    
  
    return (
      <div className="min-h-screen  p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Poultry Flock Management</h1>
            <p className="text-gray-600">Monitor and manage your poultry flocks across all facilities</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddFlockModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />Add Flock
          </Button>
          </div>
  
          <FlockSummary />
  
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search flocks by name, batch number, or breed..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
  
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="sold">Planned</SelectItem>
                    <SelectItem value="culled">Terminated</SelectItem>
                  </SelectContent>
                </Select>
  
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
  
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredData.map((flock) => (
                <FlockCard key={flock.id} flock={flock} />
              ))}
            </div>
  
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No flocks found matching your criteria</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
  
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(currentPage)=> {
                console.log("Page changed to: ", currentPage);
                setCurrentPage(currentPage);
            }} />
          </div>
        </div>

        {/* Add Flock Modal */}
        <AddFlockModal
          isOpen={isAddFlockModalOpen}
          onClose={() => setIsAddFlockModalOpen(false)}
          onSubmit={handleCreateFlock}
        />
      </div>
    )
}
export default FlockManagementPage;

