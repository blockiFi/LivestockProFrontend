"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Grid3X3,
  LayoutList,
  Plus,
  Search,
  Tractor,
  Wrench,
  Package,
  DollarSign,
  Clock,
} from "lucide-react";
import type { Equipment, EquipmentCategory, EquipmentDashboard, FarmUserRoleSummary } from "@/lib/types";
import {
  getEquipmentCategories,
  getEquipmentDashboard,
  getEquipmentList,
} from "@/lib/equipmentRequest";
import { getFarmUsers } from "@/lib/request";
import { cn, formatCurrency, Naira } from "@/lib/utils";
import AddEquipmentSheet from "@/components/equipment/AddEquipmentSheet";
import EquipmentProfileSheet from "@/components/equipment/EquipmentProfileSheet";
import { ActionGate } from "@/components/general/ActionGate";
import { ExportDataButton } from "@/components/general/ExportDataButton";
import { ACTIONS } from "@/lib/actionPermissions";
import { buildExportFilename, type ExportColumn } from "@/lib/exportData";

const EQUIPMENT_EXPORT_COLUMNS: ExportColumn<Equipment>[] = [
  { header: "Asset ID", value: (row) => row.asset_id },
  { header: "Name", value: (row) => row.name },
  { header: "Category", value: (row) => row.category?.name ?? "" },
  { header: "Location", value: (row) => row.location ?? "" },
  { header: "Assignee", value: (row) => row.assignee?.name ?? "" },
  { header: "Status", value: (row) => row.status },
  { header: "Condition", value: (row) => row.condition },
  { header: "Purchase Value", value: (row) => row.purchase_price ?? "" },
];

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", accent || "bg-emerald-100 text-emerald-700")}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    available: "bg-green-100 text-green-800 border-green-200",
    in_use: "bg-blue-100 text-blue-800 border-blue-200",
    under_maintenance: "bg-amber-100 text-amber-800 border-amber-200",
    damaged: "bg-red-100 text-red-800 border-red-200",
    retired: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs capitalize", colors[status] || "")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export default function EquipmentManagementPage() {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const [searchParams, setSearchParams] = useSearchParams();

  const [dashboard, setDashboard] = useState<EquipmentDashboard | null>(null);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [items, setItems] = useState<Equipment[]>([]);
  const [farmUsers, setFarmUsers] = useState<FarmUserRoleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !farmId) return;
    setLoading(true);
    const [dashRes, catRes, listRes, usersRes] = await Promise.all([
      getEquipmentDashboard(token, farmId),
      getEquipmentCategories(token, farmId),
      getEquipmentList(token, farmId, {
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
        page,
        per_page: 15,
        sort_by: "created_at",
        sort_direction: "desc",
      }),
      getFarmUsers(token, farmId),
    ]);

    if (dashRes.success) setDashboard(dashRes.data || null);
    if (catRes.success) setCategories(catRes.data || []);
    if (listRes.success && listRes.data) {
      const data = listRes.data as { data?: Equipment[]; last_page?: number };
      if (Array.isArray(listRes.data)) {
        setItems(listRes.data);
        setLastPage(1);
      } else {
        setItems(data.data || []);
        setLastPage(data.last_page || 1);
      }
    }
    if (usersRes.success) setFarmUsers(usersRes.data || []);
    setLoading(false);
  }, [token, farmId, search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const asset = searchParams.get("asset");
    if (!asset || !items.length) return;
    const match = items.find((i) => i.asset_id === asset);
    if (match) {
      setProfileId(match.id);
      setProfileOpen(true);
    }
  }, [searchParams, items]);

  const stats = dashboard?.stats;

  const openProfile = (item: Equipment) => {
    setProfileId(item.id);
    setProfileOpen(true);
    setSearchParams({ asset: item.asset_id });
  };

  const filteredGrid = useMemo(() => items, [items]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tractor className="h-7 w-7 text-emerald-600" />
            Equipment Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track farm assets, maintenance, assignments, and lifecycle history.</p>
        </div>
        <ActionGate anyOf={ACTIONS.equipment.manage}>
          <Button onClick={() => { setEditing(null); setAddOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Equipment
          </Button>
        </ActionGate>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} icon={Package} />
          <StatCard label="In Use" value={stats.in_use} icon={Tractor} accent="bg-blue-100 text-blue-700" />
          <StatCard label="Available" value={stats.available} icon={Package} accent="bg-green-100 text-green-700" />
          <StatCard label="Maintenance" value={stats.under_maintenance} icon={Wrench} accent="bg-amber-100 text-amber-700" />
          <StatCard label="Damaged" value={stats.damaged} icon={AlertTriangle} accent="bg-red-100 text-red-700" />
          <StatCard label="Retired" value={stats.retired} icon={Package} accent="bg-gray-100 text-gray-600" />
          <StatCard label="Purchase Value" value={`${Naira}${formatCurrency(stats.total_purchase_value)}`} icon={DollarSign} accent="bg-purple-100 text-purple-700" />
          <StatCard label="Maint. Due (7d)" value={stats.requiring_maintenance} icon={Clock} accent="bg-orange-100 text-orange-700" />
          <StatCard label="Warranty Expiring" value={stats.expiring_warranty} icon={AlertTriangle} accent="bg-yellow-100 text-yellow-800" />
          <StatCard label="Purchased (month)" value={stats.purchased_this_month} icon={Plus} accent="bg-teal-100 text-teal-700" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashboard?.upcoming_maintenance || []).length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming maintenance scheduled.</p>
            ) : (
              dashboard!.upcoming_maintenance.map((eq) => (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => openProfile(eq)}
                  className="w-full text-left flex justify-between items-center text-sm border rounded-lg p-2 hover:bg-gray-50"
                >
                  <span><span className="font-mono text-xs text-gray-400 mr-2">{eq.asset_id}</span>{eq.name}</span>
                  <span className="text-amber-700 text-xs">{eq.next_maintenance_date ? new Date(eq.next_maintenance_date).toLocaleDateString() : "—"}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {(dashboard?.recent_activity || []).map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-emerald-200 pl-2 py-1">
                <p>{log.summary}</p>
                <p className="text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <CardTitle className="text-base">Equipment Registry</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8 w-48 md:w-64"
                  placeholder="Search asset ID, name…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {["available", "in_use", "assigned", "under_maintenance", "damaged", "retired"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportDataButton
                columns={EQUIPMENT_EXPORT_COLUMNS}
                filename={buildExportFilename("equipment")}
                getRows={async () => {
                  if (!token || !farmId) return [];
                  const listRes = await getEquipmentList(token, farmId, {
                    search: search || undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
                    sort_by: "created_at",
                    sort_direction: "desc",
                  });
                  if (!listRes.success || !listRes.data) {
                    throw new Error(listRes.error?.[0] ?? "Failed to load equipment for export");
                  }
                  if (Array.isArray(listRes.data)) return listRes.data;
                  return listRes.data.data || [];
                }}
              />
              <div className="flex border rounded-md">
                <Button variant={viewMode === "table" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("table")}><LayoutList className="h-4 w-4" /></Button>
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading equipment…</p>
          ) : filteredGrid.length === 0 ? (
            <div className="text-center py-12">
              <Tractor className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No equipment registered yet.</p>
              <ActionGate anyOf={ACTIONS.equipment.manage}>
                <Button className="mt-4" onClick={() => setAddOpen(true)}>Add your first asset</Button>
              </ActionGate>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-3">Asset ID</th>
                    <th className="py-2 pr-3">Equipment</th>
                    <th className="py-2 pr-3 hidden md:table-cell">Category</th>
                    <th className="py-2 pr-3 hidden lg:table-cell">Location</th>
                    <th className="py-2 pr-3 hidden lg:table-cell">Assigned</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 hidden md:table-cell">Condition</th>
                    <th className="py-2 pr-3 hidden xl:table-cell text-right">Value</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrid.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50/80">
                      <td className="py-2.5 pr-3 font-mono text-xs">{item.asset_id}</td>
                      <td className="py-2.5 pr-3 font-medium">{item.name}</td>
                      <td className="py-2.5 pr-3 hidden md:table-cell text-gray-600">{item.category?.name || "—"}</td>
                      <td className="py-2.5 pr-3 hidden lg:table-cell text-gray-600">{item.location || "—"}</td>
                      <td className="py-2.5 pr-3 hidden lg:table-cell text-gray-600">{item.assignee?.name || "—"}</td>
                      <td className="py-2.5 pr-3">{statusBadge(item.status)}</td>
                      <td className="py-2.5 pr-3 hidden md:table-cell capitalize text-gray-600">{item.condition}</td>
                      <td className="py-2.5 pr-3 hidden xl:table-cell text-right">{item.purchase_price != null ? `${Naira}${formatCurrency(item.purchase_price)}` : "—"}</td>
                      <td className="py-2.5">
                        <Button variant="ghost" size="sm" onClick={() => openProfile(item)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGrid.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openProfile(item)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-xs text-gray-400">{item.asset_id}</p>
                        <p className="font-semibold">{item.name}</p>
                      </div>
                      {statusBadge(item.status)}
                    </div>
                    <p className="text-xs text-gray-500">{item.category?.name} · {item.location || "No location"}</p>
                    {item.purchase_price != null && (
                      <p className="text-sm font-medium">{Naira}{formatCurrency(item.purchase_price)}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm self-center text-gray-500">Page {page} of {lastPage}</span>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddEquipmentSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        editing={editing}
        onSaved={refresh}
      />

      <EquipmentProfileSheet
        equipmentId={profileId}
        open={profileOpen}
        onOpenChange={(o) => {
          setProfileOpen(o);
          if (!o) setSearchParams({});
        }}
        farmUsers={farmUsers}
        onUpdated={refresh}
      />
    </div>
  );
}
