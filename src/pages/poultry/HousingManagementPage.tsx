import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  getPoultryHouses,
  createPoultryHouse,
  deletePoultryHouse,
  updatePoultryHouse,
  getHouseCapacityRules,
} from "@/lib/request";
import type { PoultryHouse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import { Copy, Filter, Home, Info, MapPin, MoreVertical, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import AddHouseModal from "@/components/modals/AddHouseModal";
import Pagination from "@/components/general/Pagination";
import { formatDate } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HouseCapacityRule } from "@/lib/request";
import { ActionGate } from "@/components/general/ActionGate";
import { ACTIONS } from "@/lib/actionPermissions";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  empty: "bg-blue-100 text-blue-800 border-blue-200",
};

const formatRuleRange = (r: HouseCapacityRule) => {
  const max = r.max_age_days == null ? "∞" : String(r.max_age_days);
  return `${r.min_age_days}–${max} days`;
};

const HousingManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [houses, setHouses] = useState<PoultryHouse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editHouse, setEditHouse] = useState<PoultryHouse | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsHouse, setDetailsHouse] = useState<PoultryHouse | null>(null);
  const [houseRulesMap, setHouseRulesMap] = useState<Record<number, HouseCapacityRule[]>>({});
  const [rulesLoading, setRulesLoading] = useState(false);
  const [isLoadingHouses, setIsLoadingHouses] = useState(false);
  const [openHouseMenuId, setOpenHouseMenuId] = useState<number | null>(null);
  const [duplicateHouse, setDuplicateHouse] = useState<PoultryHouse | null>(null);

  const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const poultryStats = useSelector((state: RootState) => state.statistics.poultryStatistics);

  const poultryTypeMap = useMemo(() => {
    const map: Record<number, string> = {};
    const list = poultryStats?.poultry_types || [];
    for (const t of list) {
      map[t.type_id] = t.type_name;
    }
    return map;
  }, [poultryStats]);

  const fetchHouses = useCallback(async () => {
    if (!farmId || !token) return;
    setIsLoadingHouses(true);
    try {
      const response = await getPoultryHouses(token, farmId);
      if (response.success && Array.isArray(response.data)) {
        setHouses(response.data);
        // Simple client-side pagination
        setTotalPages(Math.max(1, Math.ceil(response.data.length / perPage)));

        // Preload capacity rules for all houses (as requested)
        setRulesLoading(true);
        try {
          const entries = await Promise.all(
            response.data.map(async (h) => {
              const r = await getHouseCapacityRules(token, farmId, h.id);
              return [h.id, r.success && Array.isArray(r.data) ? r.data : []] as const;
            })
          );
          const next: Record<number, HouseCapacityRule[]> = {};
          for (const [houseId, rules] of entries) next[houseId] = rules;
          setHouseRulesMap(next);
        } finally {
          setRulesLoading(false);
        }
      } else if (!response.success) {
        const msg = Array.isArray(response.error) ? response.error.join(", ") : String(response.error);
        toast.error(msg);
      }
    } finally {
      setIsLoadingHouses(false);
    }
  }, [farmId, token, perPage]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const handleCreateHouse = async (
    payload: Omit<PoultryHouse, "id" | "farm_id" | "created_at" | "updated_at" | "deleted_at">
  ) => {
    if (!farmId || !token) return;
    const res = await createPoultryHouse(token, farmId, payload);
    if (res.success && res.data) {
      toast.success("House created successfully");
      await fetchHouses();
      return res.data;
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleUpdateHouse = async (
    houseId: number,
    payload: Partial<Omit<PoultryHouse, "id" | "farm_id" | "created_at" | "updated_at" | "deleted_at">>
  ) => {
    if (!farmId || !token) return;
    const res = await updatePoultryHouse(token, farmId, houseId, payload);
    if (res.success && res.data) {
      toast.success("House updated successfully");
      await fetchHouses();
      return res.data;
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleDeleteHouse = async (houseId: number) => {
    if (!farmId || !token) return;
    const res = await deletePoultryHouse(token, farmId, houseId);
    if (res.success) {
      toast.success("House deleted successfully");
      await fetchHouses();
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
    }
  };

  const filtered = useMemo(() => {
    return houses.filter((house) => {
      const matchesSearch =
        house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (house.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || house.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [houses, searchTerm, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  const activeHouses = houses.filter(h => h.status === 'active').length
  const totalCapacity = houses.reduce((sum, h) => sum + (h.capacity || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Poultry Housing Management</h1>
          </div>
          <ActionGate anyOf={ACTIONS.houses.create}>
            <Button 
              onClick={() => {
                setDuplicateHouse(null);
                setIsAddModalOpen(true);
              }}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add New House
            </Button>
          </ActionGate>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Houses</p>
                <p className="text-3xl font-bold text-blue-900">{houses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Active Houses</p>
                <p className="text-3xl font-bold text-green-900">{activeHouses}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total Capacity</p>
                <p className="text-3xl font-bold text-purple-900">{totalCapacity.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search houses by name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11 border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Showing {filtered.length} of {houses.length} houses
            </div>
          </div>
        </Card>

        {/* House cards */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoadingHouses ? (
              Array.from({ length: Math.min(9, perPage) }).map((_, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden border border-gray-200 bg-white/60 backdrop-blur shadow-sm"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-500/70 via-indigo-500/70 to-teal-500/70" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gray-200 animate-pulse" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-9 w-full rounded-md" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : (
              paginated.map((house) => {
              const colorVariants = [
                "from-emerald-500 to-emerald-600",
                "from-teal-500 to-teal-600",
                "from-cyan-500 to-cyan-600",
                "from-blue-500 to-blue-600",
                "from-indigo-500 to-indigo-600",
                "from-purple-500 to-purple-600",
              ];
              const colorIndex = house.id % colorVariants.length;
              const gradient = colorVariants[colorIndex];
              const ruleCount = houseRulesMap[house.id]?.length ?? 0;

              return (
                <Card
                  key={house.id}
                  className="group relative overflow-hidden border border-gray-200 bg-white/70 backdrop-blur shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg"
                >
                  <div className={`absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                  <CardHeader className="relative pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`h-11 w-11 shrink-0 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}
                        >
                          <Home className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 truncate">
                            {house.name}
                          </CardTitle>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                            <span className="font-medium text-gray-800">
                              {house.capacity?.toLocaleString?.() ?? house.capacity} birds
                            </span>
                            {/* {house.dimensions && <span className="text-gray-400">•</span>}
                            {house.dimensions && <span className="truncate">{house.dimensions}</span>} */}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <Badge
                          className={`${
                            statusColors[house.status] || "bg-gray-100 text-gray-800 border-gray-200"
                          } font-medium`}
                        >
                          {house.status.charAt(0).toUpperCase() + house.status.slice(1)}
                        </Badge>

                        <DropdownMenu
                          open={openHouseMenuId === house.id}
                          onOpenChange={(open) => setOpenHouseMenuId(open ? house.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() => {
                                setOpenHouseMenuId(null);
                                setDetailsHouse(house);
                                setIsDetailsOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Info className="h-4 w-4 text-gray-700" />
                              View details
                            </DropdownMenuItem>
                            <ActionGate anyOf={ACTIONS.houses.update}>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setOpenHouseMenuId(null);
                                  setEditHouse(house);
                                  setIsEditModalOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Pencil className="h-4 w-4 text-gray-700" />
                                Edit rules
                              </DropdownMenuItem>
                            </ActionGate>
                            <ActionGate anyOf={ACTIONS.houses.create}>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setOpenHouseMenuId(null);
                                  setIsEditModalOpen(false);
                                  setEditHouse(null);
                                  setIsDetailsOpen(false);
                                  setDetailsHouse(null);
                                  setDuplicateHouse(house);
                                  setIsAddModalOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Copy className="h-4 w-4 text-gray-700" />
                                Duplicate
                              </DropdownMenuItem>
                            </ActionGate>
                            <DropdownMenuSeparator />
                            <ActionGate anyOf={ACTIONS.houses.delete}>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setOpenHouseMenuId(null);
                                  setConfirmDeleteId(house.id);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </ActionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative pt-0 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500">Poultry Type</p>
                          <p className="font-medium text-gray-800 truncate">
                            {poultryTypeMap[house.poultry_type_id] ||
                              house.poultry_type?.name ||
                              `ID: ${house.poultry_type_id}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <Wrench className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500">Litter Type</p>
                          <p className="font-medium text-gray-800 truncate">{house.liter_type_id}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Construction</p>
                        <p className="text-xs font-medium text-gray-800">
                          {house.construction_date ? formatDate(house.construction_date) : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Last Maintenance</p>
                        <p className="text-xs font-medium text-gray-800">
                          {house.last_maintenance_date ? formatDate(house.last_maintenance_date) : "None"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      {rulesLoading ? (
                        <Skeleton className="h-8 w-40 rounded-md" />
                      ) : ruleCount > 0 ? (
                        <Badge className="bg-gray-50 border-gray-200 text-gray-700 font-medium">
                          {ruleCount} capacity band{ruleCount === 1 ? "" : "s"}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-50 border-gray-200 text-gray-700 font-medium">
                          Default capacity
                        </Badge>
                      )}

                      {house.notes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-gray-700 truncate max-w-[140px] cursor-help">
                                {house.notes}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">{house.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-gray-400">No notes</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
              })
            )}
          </div>

          {filtered.length === 0 && !isLoadingHouses && (
            <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No houses found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find houses."
                  : "Get started by creating your first poultry house."}
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <ActionGate anyOf={ACTIONS.houses.create}>
                  <Button
                    onClick={() => {
                      setDuplicateHouse(null);
                      setIsAddModalOpen(true);
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First House
                  </Button>
                </ActionGate>
              )}
            </Card>
          )}

          {!isLoadingHouses && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>

        <AddHouseModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setOpenHouseMenuId(null);
            setDuplicateHouse(null);
          }}
          onSubmit={handleCreateHouse}
          onCapacityRulesSaved={fetchHouses}
          initialData={
            duplicateHouse
              ? {
                  name: duplicateHouse.name,
                  poultry_type_id: duplicateHouse.poultry_type_id,
                  liter_type_id: duplicateHouse.liter_type_id,
                  capacity: duplicateHouse.capacity,
                  dimensions: duplicateHouse.dimensions,
                  construction_date: duplicateHouse.construction_date,
                  last_maintenance_date: duplicateHouse.last_maintenance_date,
                  status: duplicateHouse.status,
                  notes: duplicateHouse.notes,
                }
              : undefined
          }
          initialCapacityRules={duplicateHouse ? houseRulesMap[duplicateHouse.id] : undefined}
        />

        <AddHouseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditHouse(null);
            setOpenHouseMenuId(null);
            setDuplicateHouse(null);
          }}
          onSubmit={async (payload) => {
            if (!editHouse) return;
            return handleUpdateHouse(editHouse.id, payload);
          }}
          initialData={editHouse ?? undefined}
          onCapacityRulesSaved={fetchHouses}
        />

        <Dialog
          open={isDetailsOpen}
          onOpenChange={(open) => {
            setIsDetailsOpen(open);
            if (!open) setOpenHouseMenuId(null);
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>House details</DialogTitle>
            </DialogHeader>
            {!detailsHouse ? (
              <div className="text-sm text-muted-foreground">No house selected.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">{detailsHouse.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Default capacity</div>
                    <div className="font-medium">{detailsHouse.capacity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">{detailsHouse.status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Poultry type</div>
                    <div className="font-medium">
                      {poultryTypeMap[detailsHouse.poultry_type_id] ||
                        detailsHouse.poultry_type?.name ||
                        `ID: ${detailsHouse.poultry_type_id}`}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Capacity rules</div>
                      <div className="text-xs text-muted-foreground">
                        {rulesLoading ? "Loading preloaded rules…" : "Age-based capacity bands for this house."}
                      </div>
                    </div>
                    <ActionGate anyOf={ACTIONS.houses.update}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!detailsHouse) return;
                          setEditHouse(detailsHouse);
                          setIsEditModalOpen(true);
                          setIsDetailsOpen(false);
                        }}
                      >
                        Edit rules
                      </Button>
                    </ActionGate>
                  </div>

                  <div className="mt-2 border rounded-md divide-y">
                    {(houseRulesMap[detailsHouse.id] || []).length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No capacity rules set. Default capacity applies.
                      </div>
                    ) : (
                      (houseRulesMap[detailsHouse.id] || [])
                        .slice()
                        .sort((a, b) => a.min_age_days - b.min_age_days)
                        .map((r) => (
                          <div key={r.id ?? `${r.min_age_days}-${r.max_age_days}-${r.capacity}`} className="p-3 flex items-center justify-between text-sm">
                            <div className="font-medium">{formatRuleRange(r)}</div>
                            <div className="text-muted-foreground">Capacity: {r.capacity}</div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Delete poultry house?"
          description="Are you sure you want to delete this poultry house? This action cannot be undone."
          type="error"
          confirmText="Delete"
          showCancel
          onConfirm={async () => {
            if (confirmDeleteId != null) {
              await handleDeleteHouse(confirmDeleteId);
              setConfirmDeleteId(null);
            }
          }}
        />
      </div>
    </div>
  );
};

export default HousingManagementPage;

