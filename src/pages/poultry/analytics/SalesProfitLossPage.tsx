import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import StatisticsCard from "@/components/general/StatisticsCard";
import { formatCurrency, Naira } from "@/lib/utils";
import type { FarmSalesProfitLoss, SalesRecord } from "@/lib/types";
import {
  createSalesRecord,
  deleteSalesRecord,
  getSalesRecords,
  updateSalesRecord,
  type ProductSaleFormPayload,
} from "@/lib/request";
import AddProductSaleModal from "@/components/modals/AddProductSaleModal";
import { Bird, DollarSign, Edit, Egg, Percent, Plus, ShoppingBag, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { ExportDataButton } from "@/components/general/ExportDataButton";
import { buildExportFilename, formatExportDate, type ExportColumn } from "@/lib/exportData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { ActionGate } from "@/components/general/ActionGate";
import { ACTIONS } from "@/lib/actionPermissions";
import { CustomerNameLink } from "@/components/crm/CustomerNameLink";

type FlockPnlRow = FarmSalesProfitLoss["flocks"][number]

const FLOCK_PNL_COLUMNS: ExportColumn<FlockPnlRow>[] = [
  { header: "Flock", value: (row) => row.flock_name },
  { header: "Batch", value: (row) => row.batch_number || "" },
  { header: "Status", value: (row) => row.status },
  { header: "Birds sold", value: (row) => row.birds_sold },
  { header: "Live birds revenue", value: (row) => row.live_bird_revenue ?? 0 },
  { header: "Product revenue", value: (row) => row.product_revenue ?? 0 },
  { header: "Total revenue", value: (row) => row.total_revenue },
  { header: "Cost", value: (row) => row.total_cost },
  { header: "Net P&L", value: (row) => row.net_profit },
]

const PRODUCT_SALE_COLUMNS: ExportColumn<SalesRecord>[] = [
  { header: "Date", value: (row) => formatExportDate(row.date) },
  { header: "Type", value: (row) => row.type },
  { header: "Flock", value: (row) => row.flock?.name ?? "" },
  { header: "Qty", value: (row) => row.quantity },
  { header: "Total", value: (row) => row.total_amount ?? 0 },
  { header: "Customer", value: (row) => row.customer_name || row.customer?.name || "" },
]

type LoaderData = {
  salesProfitLoss: FarmSalesProfitLoss | null;
  currentFarm: { id: number; name: string } | null;
};

const CATEGORY_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
const REVENUE_TYPE_COLORS: Record<string, string> = {
  live_bird: "#0ea5e9",
  egg: "#f59e0b",
  meat: "#ef4444",
  manure: "#84cc16",
};

const SalesProfitLossPage = () => {
  const { salesProfitLoss } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const token = useSelector((s: RootState) => s.authentication.token);
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id);

  const [dateFrom, setDateFrom] = useState(salesProfitLoss?.date_from || "");
  const [dateTo, setDateTo] = useState(salesProfitLoss?.date_to || "");
  const [productSales, setProductSales] = useState<SalesRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SalesRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const data = salesProfitLoss;

  const applyDateFilter = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("start_date", dateFrom);
    if (dateTo) params.set("end_date", dateTo);
    const query = params.toString();
    navigate(`/dashboard/poultry/analytics/sales-profit-loss${query ? `?${query}` : ""}`);
  };

  const loadProductSales = useCallback(async () => {
    if (!token || !farmId || !data) return;
    setLoadingProducts(true);
    try {
      const res = await getSalesRecords(token, farmId, {
        date_from: data.date_from,
        date_to: data.date_to,
      });
      if (res.success && res.data) {
        setProductSales(res.data);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, [token, farmId, data]);

  useEffect(() => {
    void loadProductSales();
  }, [loadProductSales]);

  const flockChartData = useMemo(
    () =>
      (data?.flocks || []).map((row) => ({
        name: row.flock_name,
        net_profit: row.net_profit,
        revenue: row.total_revenue,
        cost: row.total_cost,
      })),
    [data?.flocks]
  );

  const revenueByTypeChart = useMemo(() => {
    const byType = data?.revenue_by_type;
    if (!byType) return [];
    return [
      { type: "live_bird", label: "Live birds", value: byType.live_bird },
      { type: "egg", label: "Eggs", value: byType.egg },
      { type: "meat", label: "Meat", value: byType.meat },
      { type: "manure", label: "Manure", value: byType.manure },
    ].filter((row) => row.value > 0);
  }, [data?.revenue_by_type]);

  const handleCreateProductSale = async (payload: ProductSaleFormPayload) => {
    if (!token || !farmId) return;
    const res = await createSalesRecord(token, farmId, payload);
    if (res.success) {
      toast.success("Product sale recorded");
      applyDateFilter();
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleUpdateProductSale = async (payload: ProductSaleFormPayload) => {
    if (!token || !farmId || !editingProduct) return;
    const res = await updateSalesRecord(token, farmId, editingProduct.id, payload);
    if (res.success) {
      toast.success("Product sale updated");
      setEditingProduct(null);
      applyDateFilter();
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const handleDeleteProductSale = async (record: SalesRecord) => {
    if (!token || !farmId) return;
    setDeletingId(record.id);
    try {
      const res = await deleteSalesRecord(token, farmId, record.id);
      if (res.success) {
        toast.success("Product sale deleted");
        applyDateFilter();
      } else if (!res.success) {
        toast.error(Array.isArray(res.error) ? res.error.join(", ") : String(res.error));
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center text-gray-500">Unable to load sales profit and loss data.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Profit & Loss</h1>
          <p className="text-sm text-gray-500">
            Live-bird sales plus egg, meat, and manure product revenue vs flock expenditures.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="date_from" className="text-xs">From</Label>
            <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date_to" className="text-xs">To</Label>
            <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button type="button" onClick={applyDateFilter}>Apply</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatisticsCard
          cardStyles="bg-white border border-gray-200"
          title="Total revenue"
          value={formatCurrency(data.total_revenue)}
          footerIcon={null}
          footer="Live birds + products"
          icon={<DollarSign className="h-4 w-4 text-sky-500" />}
          iconStyles="bg-sky-50"
        />
        <StatisticsCard
          cardStyles="bg-white border border-gray-200"
          title="Total cost"
          value={formatCurrency(data.total_cost)}
          footerIcon={null}
          footer="Flock expenditures"
          icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
          iconStyles="bg-amber-50"
        />
        <StatisticsCard
          cardStyles="bg-white border border-gray-200"
          title="Net profit"
          value={formatCurrency(data.net_profit)}
          footerIcon={null}
          footer={data.net_profit >= 0 ? "Profitable period" : "Loss period"}
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          iconStyles="bg-emerald-50"
        />
        <StatisticsCard
          cardStyles="bg-white border border-gray-200"
          title="Margin"
          value={`${data.margin_percent.toFixed(1)}%`}
          footerIcon={null}
          footer="Net / revenue"
          icon={<Percent className="h-4 w-4 text-violet-500" />}
          iconStyles="bg-violet-50"
        />
        <StatisticsCard
          cardStyles="bg-white border border-gray-200"
          title="Birds sold"
          value={data.birds_sold.toLocaleString()}
          footerIcon={null}
          footer="Live-bird sales only"
          icon={<Bird className="h-4 w-4 text-blue-500" />}
          iconStyles="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Cost</CardTitle>
            <CardDescription>Daily combined revenue against expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: `Revenue (${Naira})`, color: "#0ea5e9" },
                cost: { label: `Cost (${Naira})`, color: "#f59e0b" },
                net_profit: { label: `Net (${Naira})`, color: "#10b981" },
              }}
              className="h-[320px]"
            >
              {data.time_series.length > 0 ? (
                <ComposedChart data={data.time_series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => new Date(String(value)).toLocaleDateString("en-US")}
                        formatter={(value) => `${Naira}${(value as number).toLocaleString()}`}
                      />
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="net_profit" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              ) : (
                <div className="text-center text-gray-500 py-16">No time-series data for this period.</div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
            <CardDescription>Live birds vs product sales</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: `Revenue (${Naira})`, color: "#0ea5e9" },
              }}
              className="h-[320px]"
            >
              {revenueByTypeChart.length > 0 ? (
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Naira}${(value as number).toLocaleString()}`}
                      />
                    }
                  />
                  <Pie
                    data={revenueByTypeChart}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ label }) => label}
                  >
                    {revenueByTypeChart.map((row) => (
                      <Cell key={row.type} fill={REVENUE_TYPE_COLORS[row.type] || "#94a3b8"} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <div className="text-center text-gray-500 py-16">No revenue in this period.</div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Category</CardTitle>
            <CardDescription>Expenditure breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total_cost: { label: `Cost (${Naira})`, color: "#8b5cf6" },
              }}
              className="h-[280px]"
            >
              {data.cost_by_category.length > 0 ? (
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Naira}${(value as number).toLocaleString()}`}
                      />
                    }
                  />
                  <Pie
                    data={data.cost_by_category}
                    dataKey="total_cost"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category }) => category}
                  >
                    {data.cost_by_category.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <div className="text-center text-gray-500 py-16">No expenditure data for this period.</div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Flock Net P&L</CardTitle>
            <CardDescription>Revenue minus cost by flock</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                net_profit: { label: `Net P&L (${Naira})`, color: "#10b981" },
              }}
              className="h-[280px]"
            >
              {flockChartData.length > 0 ? (
                <BarChart data={flockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Naira}${(value as number).toLocaleString()}`}
                      />
                    }
                  />
                  <Bar dataKey="net_profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <div className="text-center text-gray-500 py-12">No flock P&L data for this period.</div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-sky-600" />
            Flock P&L Table
          </CardTitle>
          <ExportDataButton
            rows={data.flocks}
            columns={FLOCK_PNL_COLUMNS}
            filename={buildExportFilename("sales-profit-loss", "flock-pnl")}
          />
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flock</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Birds sold</TableHead>
                  <TableHead className="text-right">Live birds</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Total revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Net P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No flock sales or expenditures in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.flocks.map((row) => (
                    <TableRow key={row.flock_id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/dashboard/poultry/flock-management/${row.flock_id}`}
                          className="text-sky-700 hover:underline"
                        >
                          {row.flock_name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.batch_number || "—"}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell className="text-right">{row.birds_sold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.live_bird_revenue ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.product_revenue ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.total_revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.total_cost)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          row.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(row.net_profit)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Egg className="h-5 w-5 text-amber-600" />
              Product Sales
            </CardTitle>
            <CardDescription>Egg, meat, and manure transactions in this period</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportDataButton
              rows={productSales}
              columns={PRODUCT_SALE_COLUMNS}
              filename={buildExportFilename("sales-profit-loss", "product-sales")}
            />
            <ActionGate anyOf={ACTIONS.sales.create}>
              <Button
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Record sale
              </Button>
            </ActionGate>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Flock</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Loading product sales...
                    </TableCell>
                  </TableRow>
                ) : productSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No product sales in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  productSales.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{row.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.flock_id ? (
                          <Link
                            to={`/dashboard/poultry/flock-management/${row.flock_id}`}
                            className="text-sky-700 hover:underline"
                          >
                            {row.flock?.name || `Flock #${row.flock_id}`}
                          </Link>
                        ) : (
                          "Farm-level"
                        )}
                      </TableCell>
                      <TableCell className="text-right">{Number(row.quantity).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.total_amount)}</TableCell>
                      <TableCell>
                        <CustomerNameLink
                          customerId={row.customer_id}
                          name={row.customer_name || row.customer?.name}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ActionGate anyOf={ACTIONS.sales.update}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingProduct(row);
                                setProductModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </ActionGate>
                          <ActionGate anyOf={ACTIONS.sales.delete}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-rose-600"
                              disabled={deletingId === row.id}
                              onClick={() => void handleDeleteProductSale(row)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </ActionGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddProductSaleModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProductSale : handleCreateProductSale}
        editing={editingProduct}
      />
    </div>
  );
};

export default SalesProfitLossPage;
