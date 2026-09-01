import { useMemo, useState } from "react";
import type { DetailedFlockRecord, FlockProfitLoss, FlockSale } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Edit, Plus, ShoppingBag, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { ExportDataButton } from "@/components/general/ExportDataButton";
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData";

const SALE_EXPORT_COLUMNS: ExportColumn<FlockSale>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Qty", value: (row) => row.quantity },
  { header: "Unit Price", value: (row) => row.unit_price ?? 0 },
  { header: "Total", value: (row) => row.total_amount ?? 0 },
  { header: "Customer", value: (row) => row.customer_name || "" },
  { header: "Notes", value: (row) => row.notes || "" },
];
import AddFlockSaleModal, { type FlockSaleFormPayload } from "@/components/modals/AddFlockSaleModal";
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog";

interface FlockSalesViewProps {
  flock: DetailedFlockRecord;
  profitLoss: FlockProfitLoss | null;
  onAddSale?: (payload: FlockSaleFormPayload) => Promise<void>;
  onUpdateSale?: (saleId: number, payload: FlockSaleFormPayload) => Promise<void>;
  onDeleteSale?: (saleId: number) => Promise<void>;
}

const FlockSalesView = ({
  flock,
  profitLoss,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
}: FlockSalesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlockSale | null>(null);
  const [deletingSale, setDeletingSale] = useState<FlockSale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sales = Array.isArray(flock.flock_sales) ? flock.flock_sales : [];

  const totals = useMemo(() => {
    return sales.reduce(
      (acc, sale) => {
        acc.birds += sale.quantity || 0;
        acc.revenue += sale.total_amount || 0;
        return acc;
      },
      { birds: 0, revenue: 0 }
    );
  }, [sales]);

  const expenditureTotal = useMemo(() => {
    const expenditures = Array.isArray(flock.flock_expenditures) ? flock.flock_expenditures : [];
    return expenditures.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [flock.flock_expenditures]);

  const netProfit = profitLoss?.net_profit ?? totals.revenue - expenditureTotal;
  const totalRevenue = profitLoss?.total_revenue ?? totals.revenue;
  const totalCost = profitLoss?.total_cost ?? expenditureTotal;

  const handleAdd = async (payload: FlockSaleFormPayload) => {
    if (!onAddSale) return;
    await onAddSale(payload);
  };

  const handleUpdate = async (payload: FlockSaleFormPayload) => {
    if (!editingSale || !onUpdateSale) return;
    await onUpdateSale(editingSale.id, payload);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSale || !onDeleteSale) return;
    setIsDeleting(true);
    try {
      await onDeleteSale(deletingSale.id);
      setDeletingSale(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingSale(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sale: FlockSale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const showActions = Boolean(onUpdateSale || onDeleteSale);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50">
            <ShoppingBag className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Live Bird Sales</CardTitle>
            <p className="text-xs text-gray-500">
              Record batch sales. Each sale automatically depletes live bird count via culling.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportDataButton
            rows={sales}
            columns={SALE_EXPORT_COLUMNS}
            filename={buildExportFilename(flock.name, "live-bird-sales")}
          />
          {onAddSale && (
            <Button size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-1" />
              Record Sale
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile label="Revenue" amount={totalRevenue} tone="primary" />
          <SummaryTile label="Expenditure" amount={totalCost} />
          <SummaryTile
            label="Net P&L"
            amount={netProfit}
            tone={netProfit >= 0 ? "positive" : "negative"}
          />
          <SummaryTile label="Birds sold" amount={totals.birds} isCount />
        </div>

        {sales.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 border rounded-md px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>No sales recorded yet. Record a live-bird sale to track revenue and deplete flock count.</span>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[90px] text-right">Qty</TableHead>
                  <TableHead className="w-[120px] text-right">Unit price</TableHead>
                  <TableHead className="w-[130px] text-right">Total</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Notes</TableHead>
                  {showActions && <TableHead className="w-[90px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell className="text-right font-medium">{sale.quantity}</TableCell>
                    <TableCell className="text-right text-sm">
                      {(sale.unit_price || 0).toLocaleString(undefined, {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {(sale.total_amount || 0).toLocaleString(undefined, {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {sale.customer_name || "—"}
                      {sale.customer_phone ? (
                        <div className="text-gray-500">{sale.customer_phone}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{sale.notes || "—"}</TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onUpdateSale && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditModal(sale)}
                              aria-label="Edit sale"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDeleteSale && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => setDeletingSale(sale)}
                              disabled={isDeleting && deletingSale?.id === sale.id}
                              aria-label="Delete sale"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddFlockSaleModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editing={editingSale}
        liveBirdCount={flock.actual_quantity}
        onSubmit={editingSale ? handleUpdate : handleAdd}
      />

      <DeleteConfirmationDialog
        isOpen={Boolean(deletingSale)}
        onClose={() => !isDeleting && setDeletingSale(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete sale"
        description={
          deletingSale
            ? `Delete this sale of ${deletingSale.quantity} bird${deletingSale.quantity === 1 ? "" : "s"} for ${(deletingSale.total_amount || 0).toLocaleString(undefined, {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 2,
              })}? Bird count will be restored and this cannot be undone.`
            : undefined
        }
        itemName={deletingSale?.customer_name || undefined}
      />
    </Card>
  );
};

const SummaryTile = ({
  label,
  amount,
  tone = "default",
  isCount = false,
}: {
  label: string;
  amount: number;
  tone?: "default" | "primary" | "positive" | "negative";
  isCount?: boolean;
}) => {
  const primaryClasses =
    "bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-lg border px-3 py-3 border-sky-500";
  const positiveClasses =
    "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg border px-3 py-3 border-emerald-500";
  const negativeClasses =
    "bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-lg border px-3 py-3 border-rose-500";
  const baseClasses = "rounded-lg border px-3 py-3 flex flex-col justify-between bg-white";

  const className =
    tone === "primary"
      ? primaryClasses
      : tone === "positive"
      ? positiveClasses
      : tone === "negative"
      ? negativeClasses
      : baseClasses;

  const isColored = tone !== "default";

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${isColored ? "text-white/90" : "text-gray-500"}`}>
          {label}
        </span>
        {tone === "positive" && <TrendingUp className="h-4 w-4 text-emerald-50" />}
        {tone === "negative" && <TrendingDown className="h-4 w-4 text-rose-50" />}
      </div>
      <div className="text-lg font-bold">
        {isCount
          ? amount.toLocaleString()
          : amount.toLocaleString(undefined, {
              style: "currency",
              currency: "NGN",
              minimumFractionDigits: 2,
            })}
      </div>
    </div>
  );
};

export default FlockSalesView;
