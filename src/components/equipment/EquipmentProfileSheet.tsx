"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast } from "react-toastify";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Equipment, FarmUserRoleSummary } from "@/lib/types";
import {
  assignEquipment,
  getEquipment,
  recordEquipmentInspection,
  recordEquipmentMaintenance,
  retireEquipment,
  transferEquipment,
} from "@/lib/equipmentRequest";
import { formatCurrency, Naira } from "@/lib/utils";

type Props = {
  equipmentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmUsers?: FarmUserRoleSummary[];
  onUpdated: () => void;
};

function statusColor(status: string) {
  const map: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    in_use: "bg-blue-100 text-blue-800",
    assigned: "bg-indigo-100 text-indigo-800",
    under_maintenance: "bg-amber-100 text-amber-800",
    damaged: "bg-red-100 text-red-800",
    retired: "bg-gray-100 text-gray-700",
    disposed: "bg-gray-100 text-gray-600",
    lost_missing: "bg-orange-100 text-orange-800",
  };
  return map[status] || "bg-gray-100 text-gray-700";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function EquipmentProfileSheet({
  equipmentId,
  open,
  onOpenChange,
  farmUsers = [],
  onUpdated,
}: Props) {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);
  const [item, setItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);

  const [maintForm, setMaintForm] = useState({
    title: "",
    performed_at: new Date().toISOString().slice(0, 10),
    total_cost: "",
    next_due_at: "",
    notes: "",
  });
  const [inspectForm, setInspectForm] = useState({
    inspection_date: new Date().toISOString().slice(0, 10),
    condition: "good",
    findings: "",
    recommended_action: "",
    next_inspection_date: "",
  });
  const [assignForm, setAssignForm] = useState({
    assigned_to_user_id: "",
    location: "",
    farm_section: "",
    department: "",
  });
  const [transferForm, setTransferForm] = useState({
    new_location: "",
    new_section: "",
    new_department: "",
    new_assignee_id: "",
    reason: "",
  });
  const [retireForm, setRetireForm] = useState({
    disposal_method: "retired",
    disposal_date: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const load = async () => {
    if (!token || !farmId || !equipmentId) return;
    setLoading(true);
    const res = await getEquipment(token, farmId, equipmentId);
    if (res.success && res.data) {
      setItem(res.data);
      setAssignForm({
        assigned_to_user_id: res.data.assigned_to_user_id ? String(res.data.assigned_to_user_id) : "",
        location: res.data.location || "",
        farm_section: res.data.farm_section || "",
        department: res.data.department || "",
      });
    } else {
      toast.error((res.error || []).join(", ") || "Failed to load equipment");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && equipmentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipmentId, token, farmId]);

  const submitMaintenance = async () => {
    if (!token || !farmId || !item) return;
    const res = await recordEquipmentMaintenance(token, farmId, item.id, {
      title: maintForm.title || "Maintenance",
      performed_at: maintForm.performed_at,
      total_cost: maintForm.total_cost ? Number(maintForm.total_cost) : 0,
      next_due_at: maintForm.next_due_at || undefined,
      notes: maintForm.notes,
    });
    if (res.success) {
      toast.success("Maintenance recorded");
      load();
      onUpdated();
    } else toast.error((res.error || []).join(", "));
  };

  const submitInspection = async () => {
    if (!token || !farmId || !item) return;
    const res = await recordEquipmentInspection(token, farmId, item.id, inspectForm);
    if (res.success) {
      toast.success("Inspection recorded");
      load();
      onUpdated();
    } else toast.error((res.error || []).join(", "));
  };

  const submitAssign = async () => {
    if (!token || !farmId || !item) return;
    const res = await assignEquipment(token, farmId, item.id, {
      assigned_to_user_id: assignForm.assigned_to_user_id ? Number(assignForm.assigned_to_user_id) : null,
      location: assignForm.location,
      farm_section: assignForm.farm_section,
      department: assignForm.department,
    });
    if (res.success) {
      toast.success("Assignment updated");
      load();
      onUpdated();
    } else toast.error((res.error || []).join(", "));
  };

  const submitTransfer = async () => {
    if (!token || !farmId || !item) return;
    const res = await transferEquipment(token, farmId, item.id, {
      new_location: transferForm.new_location,
      new_section: transferForm.new_section,
      new_department: transferForm.new_department,
      new_assignee_id: transferForm.new_assignee_id ? Number(transferForm.new_assignee_id) : null,
      reason: transferForm.reason,
    });
    if (res.success) {
      toast.success("Transfer recorded");
      load();
      onUpdated();
    } else toast.error((res.error || []).join(", "));
  };

  const submitRetire = async () => {
    if (!token || !farmId || !item) return;
    const res = await retireEquipment(token, farmId, item.id, retireForm);
    if (res.success) {
      toast.success("Equipment retired");
      load();
      onUpdated();
    } else toast.error((res.error || []).join(", "));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-6">
        {loading || !item ? (
          <div className="py-12 text-center text-gray-500">{loading ? "Loading…" : "No equipment selected"}</div>
        ) : (
          <>
            <SheetHeader className="p-0 pr-8 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-xl">{item.name}</SheetTitle>
                  <SheetDescription className="font-mono text-sm mt-1">{item.asset_id}</SheetDescription>
                </div>
                <Badge className={statusColor(item.status)}>{item.status.replace(/_/g, " ")}</Badge>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Category</span><p className="font-medium">{item.category?.name || "—"}</p></div>
                  <div><span className="text-gray-500">Condition</span><p className="font-medium capitalize">{item.condition}</p></div>
                  <div><span className="text-gray-500">Brand / Model</span><p className="font-medium">{[item.brand, item.model].filter(Boolean).join(" ") || "—"}</p></div>
                  <div><span className="text-gray-500">Serial</span><p className="font-medium">{item.serial_number || "—"}</p></div>
                  <div><span className="text-gray-500">Location</span><p className="font-medium">{item.location || "—"}</p></div>
                  <div><span className="text-gray-500">Assigned to</span><p className="font-medium">{item.assignee?.name || "—"}</p></div>
                  <div><span className="text-gray-500">Next maintenance</span><p className="font-medium">{fmtDate(item.next_maintenance_date)}</p></div>
                  <div><span className="text-gray-500">Warranty</span><p className="font-medium">{item.warranty_active ? `Active until ${fmtDate(item.warranty_expires_at)}` : fmtDate(item.warranty_expires_at)}</p></div>
                </div>
                {item.description && <p className="text-sm text-gray-600 border-t pt-3">{item.description}</p>}
                {item.profile_url && (
                  <p className="text-xs text-gray-400 break-all">Profile link: {item.profile_url}</p>
                )}
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Assign to</Label>
                    <select
                      className="w-full border rounded-md h-10 px-3 text-sm"
                      value={assignForm.assigned_to_user_id}
                      onChange={(e) => setAssignForm((f) => ({ ...f, assigned_to_user_id: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {farmUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div><Label>Section</Label><Input value={assignForm.farm_section} onChange={(e) => setAssignForm((f) => ({ ...f, farm_section: e.target.value }))} /></div>
                  <div><Label>Location</Label><Input value={assignForm.location} onChange={(e) => setAssignForm((f) => ({ ...f, location: e.target.value }))} /></div>
                  <div><Label>Department</Label><Input value={assignForm.department} onChange={(e) => setAssignForm((f) => ({ ...f, department: e.target.value }))} /></div>
                </div>
                <Button onClick={submitAssign}>Save assignment</Button>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm">Assignment history</h4>
                  {(item.assignments || []).slice(0, 10).map((a) => (
                    <div key={a.id} className="text-sm border rounded p-2">
                      <span className="font-medium">{a.assignee?.name || "Unassigned"}</span>
                      <span className="text-gray-500"> · {fmtDate(a.assigned_at)}</span>
                      {a.location && <span className="text-gray-500"> · {a.location}</span>}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3 bg-gray-50">
                  <div><Label>Title</Label><Input value={maintForm.title} onChange={(e) => setMaintForm((f) => ({ ...f, title: e.target.value }))} /></div>
                  <div><Label>Date</Label><Input type="date" value={maintForm.performed_at} onChange={(e) => setMaintForm((f) => ({ ...f, performed_at: e.target.value }))} /></div>
                  <div><Label>Total cost</Label><Input type="number" value={maintForm.total_cost} onChange={(e) => setMaintForm((f) => ({ ...f, total_cost: e.target.value }))} /></div>
                  <div><Label>Next due</Label><Input type="date" value={maintForm.next_due_at} onChange={(e) => setMaintForm((f) => ({ ...f, next_due_at: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={maintForm.notes} onChange={(e) => setMaintForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                  <Button onClick={submitMaintenance} className="sm:col-span-2 w-fit">Record maintenance</Button>
                </div>
                {(item.maintenance_logs || []).map((m) => (
                  <div key={m.id} className="text-sm border rounded p-3">
                    <div className="font-medium">{m.title || m.maintenance_type}</div>
                    <div className="text-gray-500">{fmtDate(m.performed_at)} · {Naira}{formatCurrency(m.total_cost || 0)}</div>
                    {m.notes && <p className="mt-1">{m.notes}</p>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="inspections" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3 bg-gray-50">
                  <div><Label>Date</Label><Input type="date" value={inspectForm.inspection_date} onChange={(e) => setInspectForm((f) => ({ ...f, inspection_date: e.target.value }))} /></div>
                  <div><Label>Condition</Label><Input value={inspectForm.condition} onChange={(e) => setInspectForm((f) => ({ ...f, condition: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Findings</Label><Textarea value={inspectForm.findings} onChange={(e) => setInspectForm((f) => ({ ...f, findings: e.target.value }))} rows={2} /></div>
                  <div className="sm:col-span-2"><Label>Recommended action</Label><Textarea value={inspectForm.recommended_action} onChange={(e) => setInspectForm((f) => ({ ...f, recommended_action: e.target.value }))} rows={2} /></div>
                  <Button onClick={submitInspection} className="w-fit">Record inspection</Button>
                </div>
                {(item.inspections || []).map((i) => (
                  <div key={i.id} className="text-sm border rounded p-3">
                    <div className="font-medium capitalize">{i.condition} · {fmtDate(i.inspection_date)}</div>
                    {i.findings && <p className="mt-1">{i.findings}</p>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="financials" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border rounded p-3"><p className="text-gray-500">Purchase</p><p className="text-lg font-semibold">{Naira}{formatCurrency(item.purchase_price || 0)}</p><p className="text-xs text-gray-400">{fmtDate(item.purchase_date)}</p></div>
                  <div className="border rounded p-3"><p className="text-gray-500">Maintenance</p><p className="text-lg font-semibold">{Naira}{formatCurrency(item.total_maintenance_cost || 0)}</p></div>
                  <div className="border rounded p-3"><p className="text-gray-500">Repairs</p><p className="text-lg font-semibold">{Naira}{formatCurrency(item.total_repair_cost || 0)}</p></div>
                  <div className="border rounded p-3 bg-emerald-50"><p className="text-gray-500">Total cost</p><p className="text-lg font-bold">{Naira}{formatCurrency(item.total_cost || 0)}</p></div>
                </div>
                <p className="text-sm text-gray-500">Supplier: {item.supplier || "—"} · Invoice: {item.invoice_reference || "—"}</p>
              </TabsContent>

              <TabsContent value="history" className="space-y-2 mt-4">
                {(item.activity_logs || []).map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1">
                    <span className="text-gray-400 whitespace-nowrap">{fmtDate(log.created_at)}</span>
                    <div>
                      <p>{log.summary}</p>
                      {log.actor && <p className="text-xs text-gray-400">{log.actor.name}</p>}
                    </div>
                  </div>
                ))}
                {(item.transfers || []).length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-medium text-sm mb-2">Transfers</h4>
                    {item.transfers!.map((t) => (
                      <div key={t.id} className="text-sm text-gray-600 mb-1">
                        {fmtDate(t.transferred_at)}: {t.previous_location || "—"} → {t.new_location || "—"}
                        {t.reason && ` (${t.reason})`}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6 mt-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Transfer equipment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>New location</Label><Input value={transferForm.new_location} onChange={(e) => setTransferForm((f) => ({ ...f, new_location: e.target.value }))} /></div>
                    <div><Label>New section</Label><Input value={transferForm.new_section} onChange={(e) => setTransferForm((f) => ({ ...f, new_section: e.target.value }))} /></div>
                    <div><Label>Reason</Label><Input value={transferForm.reason} onChange={(e) => setTransferForm((f) => ({ ...f, reason: e.target.value }))} /></div>
                  </div>
                  <Button variant="outline" onClick={submitTransfer}>Record transfer</Button>
                </div>
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-medium text-red-700">Retire / dispose</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Method</Label>
                      <select className="w-full border rounded-md h-10 px-3 text-sm" value={retireForm.disposal_method} onChange={(e) => setRetireForm((f) => ({ ...f, disposal_method: e.target.value }))}>
                        {["retired", "sold", "scrapped", "donated", "disposed", "lost"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div><Label>Date</Label><Input type="date" value={retireForm.disposal_date} onChange={(e) => setRetireForm((f) => ({ ...f, disposal_date: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><Label>Reason</Label><Textarea value={retireForm.reason} onChange={(e) => setRetireForm((f) => ({ ...f, reason: e.target.value }))} rows={2} /></div>
                  </div>
                  <Button variant="destructive" onClick={submitRetire}>Retire equipment</Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
