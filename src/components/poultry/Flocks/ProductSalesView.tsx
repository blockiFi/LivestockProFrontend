import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { SalesRecord } from "@/lib/types";
import {
  createSalesRecord,
  deleteSalesRecord,
  getSalesRecords,
  updateSalesRecord,
  type ProductSaleFormPayload,
} from "@/lib/request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AddProductSaleModal from "@/components/modals/AddProductSaleModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit, Egg, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

interface ProductSalesViewProps {
  flockId: number;
  flockName?: string;
  canManage?: boolean;
}

const typeLabel: Record<string, string> = {
  egg: "Eggs",
  meat: "Meat",
  manure: "Manure",
};

const ProductSalesView = ({ flockId, flockName, canManage = true }: ProductSalesViewProps) => {
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalesRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token || !farmId) return;
    setLoading(true);
    try {
      const res = await getSalesRecords(token, farmId, { flock_id: flockId });
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [token, farmId, flockId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, row) => {
        acc.revenue += row.total_amount || 0;
        acc.byType[row.type] = (acc.byType[row.type] || 0) + (row.total_amount || 0);
        return acc;
      },
      { revenue: 0, byType: {} as Record<string, number> }
    );
  }, [records]);

  const handleCreate = async (payload: ProductSaleFormPayload) => {
    if (!token || !farmId) return;
    const res = await createSalesRecord(token, farmId, {
      ...payload,
      flock_id: flockId,
    });
    if (res.success) {
      toast.success("Product sale recorded");
      await load();
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleUpdate = async (payload: ProductSaleFormPayload) => {
    if (!token || !farmId || !editing) return;
    const res = await updateSalesRecord(token, farmId, editing.id, {
      ...payload,
      flock_id: flockId,
    });
    if (res.success) {
      toast.success("Product sale updated");
      setEditing(null);
      await load();
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleDelete = async (record: SalesRecord) => {
    if (!token || !farmId) return;
    setDeletingId(record.id);
    try {
      const res = await deleteSalesRecord(token, farmId, record.id);
      if (res.success) {
        toast.success("Product sale deleted");
        await load();
      } else if (!res.success) {
        toast.error(Array.isArray(res.error) ? res.error.join(", ") : String(res.error));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-50 p-2">
            <Egg className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <CardTitle className="text-base">Product Sales</CardTitle>
            <p className="text-xs text-slate-500">
              Egg, meat, and manure revenue for {flockName || "this flock"}
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Record product sale
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryTile label="Product revenue" value={formatCurrency(totals.revenue)} />
          <SummaryTile label="Egg sales" value={formatCurrency(totals.byType.egg || 0)} />
          <SummaryTile label="Meat sales" value={formatCurrency(totals.byType.meat || 0)} />
          <SummaryTile label="Manure sales" value={formatCurrency(totals.byType.manure || 0)} />
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center text-slate-500 py-8">
                    Loading product sales...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center text-slate-500 py-8">
                    No product sales recorded for this flock yet.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {typeLabel[row.type] || row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{Number(row.quantity).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.total_amount)}</TableCell>
                    <TableCell>{row.customer_name || row.customer?.name || "—"}</TableCell>
                    <TableCell className="capitalize">{row.payment_status || "paid"}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditing(row);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDelete(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AddProductSaleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
        editing={editing}
        defaultFlockId={flockId}
        lockFlock
      />
    </Card>
  );
};

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default ProductSalesView;
