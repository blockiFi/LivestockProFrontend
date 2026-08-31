"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Search, Wheat, Package, TrendingUp } from "lucide-react";
import type { FeedComponent } from "@/lib/types";
import { createFeedComponent, deleteFeedComponent, getFeedComponents, updateFeedComponent } from "@/lib/request";
import AddFeedComponentModal from "@/components/modals/AddFeedComponentModal";
import { ActionGate } from "@/components/general/ActionGate";
import { ACTIONS } from "@/lib/actionPermissions";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
};

function fmt(v?: number | null, suffix: string = "") {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n}${suffix}`;
}

export default function FeedComponentsPage() {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  const [components, setComponents] = useState<FeedComponent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeedComponent | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchList = async () => {
    if (!token || !farmId) return;
    const res = await getFeedComponents(token, farmId, { search: searchTerm || undefined, status: statusFilter });
    if (res.success) {
      setComponents(res.data || []);
    } else {
      toast.error((res.error || []).join(", ") || "Failed to load feed components");
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, farmId]);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return (components || []).filter((c) => {
      if (statusFilter !== "all" && (c.status ?? "active") !== statusFilter) return false;
      if (!s) return true;
      return (c.name || "").toLowerCase().includes(s);
    });
  }, [components, searchTerm, statusFilter]);

  const handleUpsert = async (payload: Partial<FeedComponent>) => {
    if (!token || !farmId) return;
    // If editing is set, update that record.
    // Otherwise, check if a component with the same name already exists (e.g. created by AI assist)
    if (editing) {
      const res = await updateFeedComponent(token, farmId, editing.id, payload);
      if (res.success) toast.success("Feed component updated");
      else throw new Error((res.error || []).join(", ") || "Failed to update feed component");
    } else {
      const name = (payload.name || "").toString().trim().toLowerCase();
      const existing = name
        ? components.find((c) => (c.name || "").toLowerCase() === name)
        : undefined;

      if (existing) {
        const res = await updateFeedComponent(token, farmId, existing.id, payload);
        if (res.success) toast.success("Feed component updated");
        else throw new Error((res.error || []).join(", ") || "Failed to update feed component");
      } else {
        const res = await createFeedComponent(token, farmId, payload);
        if (res.success) toast.success("Feed component created");
        else throw new Error((res.error || []).join(", ") || "Failed to create feed component");
      }
    }
    setEditing(null);
    await fetchList();
  };

  const handleDelete = async (id: number) => {
    if (!token || !farmId) return;
    const res = await deleteFeedComponent(token, farmId, id);
    if (res.success) {
      toast.success("Feed component deleted");
      await fetchList();
    } else {
      toast.error((res.error || []).join(", ") || "Failed to delete feed component");
    }
  };

  const activeCount = components.filter(c => (c.status ?? "active") === "active").length;
  const inactiveCount = components.filter(c => (c.status ?? "active") === "inactive").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Feed Components</h1>
            <p className="text-gray-600 text-lg">Manage ingredients like maize, soybean meal, fish meal, etc.</p>
          </div>
          <ActionGate anyOf={ACTIONS.feedProducts.create}>
            <Button
              onClick={() => {
                setEditing(null);
                setIsModalOpen(true);
              }}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add New Component
            </Button>
          </ActionGate>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Components</p>
                <p className="text-3xl font-bold text-blue-900">{components.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Active Components</p>
                <p className="text-3xl font-bold text-green-900">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Wheat className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Inactive Components</p>
                <p className="text-3xl font-bold text-purple-900">{inactiveCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
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
                placeholder="Search components by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[150px] h-11 border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Showing {filtered.length} of {components.length} components
            </div>
          </div>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const colorVariants = [
            "from-amber-500 to-amber-600",
            "from-orange-500 to-orange-600",
            "from-yellow-500 to-yellow-600",
            "from-green-500 to-green-600",
            "from-blue-500 to-blue-600",
            "from-purple-500 to-purple-600",
          ]
          const colorIndex = c.id % colorVariants.length
          const gradient = colorVariants[colorIndex]

          return (
            <Card key={c.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
              <CardHeader className="pb-3 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Wheat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">{c.name}</CardTitle>
                      <div className="text-xs text-gray-600">Unit: {c.unit || "kg"}</div>
                    </div>
                  </div>
                  <Badge className={`${statusColors[c.status] || statusColors.active} font-medium px-3 py-1`}>
                    {(c.status || "active").charAt(0).toUpperCase() + (c.status || "active").slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 bg-white">
                {c.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">{c.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Crude Protein</p>
                    <p className="font-bold text-gray-900">{fmt(c.crude_protein, "%")}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Metab. Energy</p>
                    <p className="font-bold text-gray-900">{fmt(c.metabolizable_energy, " kcal/kg")}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Crude Fat</p>
                    <p className="font-bold text-gray-900">{fmt(c.crude_fat, "%")}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Crude Fiber</p>
                    <p className="font-bold text-gray-900">{fmt(c.crude_fiber, "%")}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Calcium</p>
                    <p className="font-bold text-gray-900">{fmt(c.calcium, "%")}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Phosphorus</p>
                    <p className="font-bold text-gray-900">{fmt(c.phosphorus, "%")}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <ActionGate anyOf={ACTIONS.feedProducts.update}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(c);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                  </ActionGate>
                  <ActionGate anyOf={ACTIONS.feedProducts.delete}>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setConfirmDeleteId(c.id);
                        setIsDeleteOpen(true);
                      }}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </ActionGate>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No feed components found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria to find components."
              : "Get started by creating your first feed component."}
          </p>
          {(!searchTerm && statusFilter === "all") && (
            <ActionGate anyOf={ACTIONS.feedProducts.create}>
              <Button
                onClick={() => {
                  setEditing(null);
                  setIsModalOpen(true);
                }}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                Create Your First Component
              </Button>
            </ActionGate>
          )}
        </Card>
      )}
      </div>

      <AddFeedComponentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpsert}
        editing={editing}
      />

      <AlertDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete feed component?"
        description="Are you sure you want to delete this feed component? This action cannot be undone."
        type="error"
        confirmText="Delete"
        showCancel
        onConfirm={async () => {
          if (confirmDeleteId != null) {
            await handleDelete(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
      />
    </div>
  );
}

