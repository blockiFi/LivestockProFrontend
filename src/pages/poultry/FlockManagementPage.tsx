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
  Clock,
  Layers,
} from "lucide-react"
import FlockSummary from "@/components/poultry/Flocks/FlockSummary"
import Pagination from "@/components/general/Pagination"
import { getFlocks, createFlock, getPoultryStatistics } from "@/lib/request"
import type { FlockRecord } from "@/lib/types"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/store"
import chicken from "@/assets/chicken.png"
import { useNavigate } from "react-router-dom"
import AddFlockModal from "@/components/modals/AddFlockModal"
import { toast } from "react-toastify"
import { setPoultryStatistics } from "@/store/StatisticsSlice"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { UpgradeModal, isUpgradeCode } from "@/components/general/UpgradeModal"

type FlockStatusKey = "active" | "completed" | "sold" | "culled"

const statusConfig: Record<
  FlockStatusKey,
  { label: string; badge: string; dot: string; accent: string }
> = {
  active: {
    label: "Active",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-500",
    accent: "border-l-blue-500",
  },
  sold: {
    label: "Sold",
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
  },
  culled: {
    label: "Terminated",
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-500",
    accent: "border-l-rose-500",
  },
}

const defaultStatusStyle = {
  label: "Unknown",
  badge: "bg-slate-50 text-slate-600 border-slate-200/80",
  dot: "bg-slate-400",
  accent: "border-l-slate-400",
}

function getStatusStyle(status: string) {
  if (status in statusConfig) {
    return statusConfig[status as FlockStatusKey]
  }
  return {
    ...defaultStatusStyle,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getFlockAgeDays(flock: FlockRecord): number {
  const arrival = new Date(flock.arrival_date)
  const now = new Date()
  const daysSinceArrival = Math.floor(
    (now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
  )
  return flock.arrival_age_days + Math.max(0, daysSinceArrival)
}

function getCapacityPercent(flock: FlockRecord): number | null {
  const capacity = flock.poultry_house?.capacity
  if (!capacity || capacity <= 0) return null
  return Math.min(100, Math.round((flock.actual_quantity / capacity) * 100))
}

const FlockCard = ({ flock }: { flock: FlockRecord }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()
  const statusStyle = getStatusStyle(flock.status)
  const ageDays = getFlockAgeDays(flock)
  const capacityPercent = getCapacityPercent(flock)

  const viewFlock = () => {
    navigate(`/dashboard/poultry/flock-management/${flock.id}`)
  }

  return (
    <Card
      className={`w-full group overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md border-l-4 ${statusStyle.accent}`}
    >
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 truncate">
              {flock.name}
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
              <span className="font-medium text-slate-600">{flock.batch_number}</span>
              <span className="text-slate-300">·</span>
              <span>{flock.breed}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 gap-1.5 font-medium px-2.5 py-1 ${statusStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        <button
          type="button"
          onClick={viewFlock}
          className="w-full text-left rounded-lg transition-colors hover:bg-slate-50/80 -mx-1 px-1 py-1"
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Quantity
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <img src={chicken} alt="" className="h-4 w-4 opacity-70" />
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {flock.actual_quantity.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Arrival
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(flock.arrival_date)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                House
              </p>
              <div className="mt-1 flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {flock.poultry_house.name}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{flock.poultry_house.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Type & Stage
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                {flock.poultry_type.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{flock.flock_stage.name}</p>
            </div>
          </div>

          <div className="space-y-2.5 mb-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3 w-3" />
                Current age
              </span>
              <span className="font-medium text-slate-700 tabular-nums">
                {ageDays} days
              </span>
            </div>
            {capacityPercent !== null && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Pen capacity</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {capacityPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityPercent >= 90
                        ? "bg-amber-500"
                        : capacityPercent >= 75
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </button>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-9 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              <span className="text-xs font-medium uppercase tracking-wide">
                {isExpanded ? "Hide details" : "Show details"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/60">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                  Source
                </p>
                <p className="text-sm text-slate-700">{flock.source}</p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                  Expected end
                </p>
                <p className="text-sm text-slate-700">
                  {formatDate(flock.expected_end_date)}
                </p>
              </div>

              {flock.actual_end_date && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                    Actual end
                  </p>
                  <p className="text-sm text-slate-700">
                    {formatDate(flock.actual_end_date)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                  Last updated
                </p>
                <p className="text-sm text-slate-700">{formatDate(flock.updated_at)}</p>
              </div>
            </div>

            {flock.notes && (
              <div className="p-4 rounded-lg border border-slate-200/80 bg-white">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{flock.notes}</p>
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

const FlockManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [flocks, setFlocks] = useState<FlockRecord[]>([])
  const [perPage, setPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([])
  const [isAddFlockModalOpen, setIsAddFlockModalOpen] = useState(false)
  const [upgrade, setUpgrade] = useState<{ code?: string; message?: string } | null>(null)
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const PoultryStatistics = useSelector(
    (state: RootState) => state.statistics.poultryStatistics
  )
  const dispatch = useDispatch()

  const refreshSummary = async () => {
    if (!farmId || !token) return
    const response = await getPoultryStatistics(token, farmId)
    if (response.success) {
      dispatch(setPoultryStatistics(response.data ?? null))
    }
  }

  const fetchFlocks = async (page?: number, perPage?: number) => {
    if (!farmId) return
    const response = await getFlocks(token, farmId, true, page, perPage)
    if (response.success) {
      setCurrentPage(response.current_page || 1)
      setPerPage(response.per_page || 6)
      setTotalPages(response.total_pages || 1)
      setFlocks(response.data || [])
    }
  }

  useEffect(() => {
    if (
      PoultryStatistics &&
      PoultryStatistics.poultry_types &&
      PoultryStatistics.poultry_types.length > 0
    ) {
      setUniqueTypes(
        Array.from(
          new Set(PoultryStatistics.poultry_types.map((type) => type.type_name))
        )
      )
    }
  }, [PoultryStatistics])

  useEffect(() => {
    fetchFlocks(currentPage, perPage)
  }, [currentPage, token, perPage, farmId])

  useEffect(() => {
    void refreshSummary()
  }, [farmId, token])

  const handleCreateFlock = async (flockData: any) => {
    if (!farmId || !token) return

    try {
      const response = await createFlock(token, farmId, flockData)
      if (response.success) {
        toast.success("Flock created successfully!")
        setIsAddFlockModalOpen(false)
        await Promise.all([fetchFlocks(currentPage, perPage), refreshSummary()])
      } else {
        let errorMessage = "Unknown error occurred"

        if ((response as any).message) {
          errorMessage = (response as any).message
        } else if (
          response.error &&
          Array.isArray(response.error) &&
          response.error.length > 0
        ) {
          errorMessage = response.error.join(", ")
        } else if (response.error) {
          errorMessage = Array.isArray(response.error)
            ? response.error.join(", ")
            : response.error
        }

        if (isUpgradeCode(response.code)) {
          setIsAddFlockModalOpen(false)
          setUpgrade({ code: response.code, message: errorMessage })
          return
        }

        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Unknown error occurred") {
        throw error
      } else {
        toast.error("An error occurred while creating the flock. Please try again.")
        throw new Error("Network or unexpected error occurred")
      }
    }
  }

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
  }, [searchTerm, statusFilter, typeFilter, flocks])

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
              Poultry
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              Flock Management
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm md:text-base max-w-xl">
              Monitor and manage your poultry flocks across all facilities
            </p>
          </div>
          <ActionGate anyOf={ACTIONS.flocks.create}>
            <Button
              onClick={() => setIsAddFlockModalOpen(true)}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm shrink-0"
              size="default"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                <Plus className="h-4 w-4" />
              </span>
              Add New Flock
            </Button>
          </ActionGate>
        </div>

        <FlockSummary />

        {/* Search and Filters */}
        <Card className="p-4 border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search by name, batch number, or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-10 border-slate-200 bg-white">
                  <Filter className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="culled">Terminated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-10 border-slate-200 bg-white">
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

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                {filteredData.length} of {flocks.length} flocks
              </span>
            </div>
          </div>
        </Card>

        {/* Flocks Grid */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredData.map((flock) => (
              <FlockCard key={flock.id} flock={flock} />
            ))}
          </div>

          {filteredData.length === 0 && (
            <Card className="mt-2 p-12 md:p-16 text-center border border-dashed border-slate-200 bg-white shadow-sm">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Layers className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No flocks found
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find flocks."
                  : "Get started by creating your first flock."}
              </p>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
                <ActionGate anyOf={ACTIONS.flocks.create}>
                  <Button
                    onClick={() => setIsAddFlockModalOpen(true)}
                    className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Flock
                  </Button>
                </ActionGate>
              )}
            </Card>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <AddFlockModal
        isOpen={isAddFlockModalOpen}
        onClose={() => setIsAddFlockModalOpen(false)}
        onSubmit={handleCreateFlock}
      />
      <UpgradeModal
        open={upgrade !== null}
        onOpenChange={(open) => { if (!open) setUpgrade(null) }}
        code={upgrade?.code}
        message={upgrade?.message}
      />
    </div>
  )
}

export default FlockManagementPage
