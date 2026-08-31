import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import type { DetailedFlockRecord, FlockExpenditure, FlockExpenditureSummary, FlockProfitLoss } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { formatCurrency, formatDate, Naira } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Download,
  DollarSign,
  Edit,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import AddFlockExpenditureModal, { type FlockExpenditureFormPayload } from "@/components/modals/AddFlockExpenditureModal";
import DeleteConfirmationDialog from "@/components/modals/DeleteConfirmationDialog";
import Pagination from "@/components/general/Pagination";
import {
  EXPENDITURE_CATEGORY_META,
  exportExpendituresCsv,
  getCategoryBadgeClass,
  getCategoryLabel,
  getSourceLabel,
  isManualExpenditure,
  resolveDateRange,
  type DateRangePreset,
} from "@/lib/expenditureCategories";
import { getFlockExpenditureSummary } from "@/lib/request";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface FlockExpenditureViewProps {
  flock: DetailedFlockRecord;
  profitLoss?: FlockProfitLoss | null;
  onAddExpenditure?: (payload: FlockExpenditureFormPayload) => Promise<void>;
  onUpdateExpenditure?: (expenditureId: number, payload: FlockExpenditureFormPayload) => Promise<void>;
  onDeleteExpenditure?: (expenditureId: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const ROWS_PER_PAGE = 10;

const FlockExpenditureView = ({
  flock,
  profitLoss,
  onAddExpenditure,
  onUpdateExpenditure,
  onDeleteExpenditure,
  onRefresh,
}: FlockExpenditureViewProps) => {
  const token = useSelector((state: RootState) => state.authentication.token);
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "auto" | "manual">("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<FlockExpenditure | null>(null);
  const [deletingExpenditure, setDeletingExpenditure] = useState<FlockExpenditure | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summary, setSummary] = useState<FlockExpenditureSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<"breakdown" | "trend">("breakdown");

  const expenditures = Array.isArray(flock.flock_expenditures) ? flock.flock_expenditures : [];
  const { dateFrom, dateTo } = resolveDateRange(datePreset, customDateFrom, customDateTo);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return expenditures
      .filter((e) => {
        if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
        if (sourceFilter === "manual" && !isManualExpenditure(e.source_type)) return false;
        if (sourceFilter === "auto" && isManualExpenditure(e.source_type)) return false;

        const rowDate = e.date?.includes("T") ? e.date.split("T")[0] : e.date;
        if (dateFrom && rowDate < dateFrom) return false;
        if (dateTo && rowDate > dateTo) return false;

        if (query) {
          const haystack = [
            e.description,
            e.reference_no,
            e.payment_method,
            getCategoryLabel(e.category),
            getSourceLabel(e.source_type),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [expenditures, categoryFilter, sourceFilter, dateFrom, dateTo, searchQuery]);

  const loadSummary = useCallback(async () => {
    if (!token || !farmId || !flock.id) return;
    setLoadingSummary(true);
    try {
      const response = await getFlockExpenditureSummary(token, farmId, flock.id, {
        category: categoryFilter === "all" ? undefined : categoryFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        search: searchQuery.trim() || undefined,
      });
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [token, farmId, flock.id, categoryFilter, dateFrom, dateTo, sourceFilter, searchQuery]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, sourceFilter, datePreset, customDateFrom, customDateTo, searchQuery, expenditures.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const chartData = useMemo(
    () =>
      (summary?.by_category || []).map((item) => ({
        name: getCategoryLabel(item.category),
        value: item.total_cost,
        category: item.category,
        fill: EXPENDITURE_CATEGORY_META[item.category]?.chartColor || "#9ca3af",
      })),
    [summary]
  );

  const trendData = useMemo(() => summary?.cost_by_date || [], [summary]);

  const topCategories = useMemo(() => chartData.slice(0, 4), [chartData]);

  const handleRefresh = async () => {
    await onRefresh?.();
    await loadSummary();
  };

  const handleExport = () => {
    exportExpendituresCsv(filtered, flock.name);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpenditure || !onDeleteExpenditure) return;
    setIsDeleting(true);
    try {
      await onDeleteExpenditure(deletingExpenditure.id);
      setDeletingExpenditure(null);
      await loadSummary();
    } finally {
      setIsDeleting(false);
    }
  };

  const showActions = Boolean(onUpdateExpenditure || onDeleteExpenditure);
  const colSpan = showActions ? 7 : 6;
  const displayCurrency = expenditures[0]?.currency || "NGN";

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: 2,
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cost & Expenditure</h2>
            <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
              Track every cost for this flock — auto-recorded from feed, medication, and vaccination events, plus manual operational expenses.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          {onAddExpenditure && (
            <Button size="sm" onClick={() => { setEditingExpenditure(null); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Record expense
            </Button>
          )}
        </div>
      </div>

      {/* P&L context */}
      {profitLoss && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="Total revenue"
            value={formatMoney(profitLoss.total_revenue)}
            icon={TrendingUp}
            tone="positive"
          />
          <MetricCard
            label="Total cost"
            value={formatMoney(profitLoss.total_cost)}
            icon={TrendingDown}
            tone="negative"
          />
          <MetricCard
            label="Net profit"
            value={formatMoney(profitLoss.net_profit)}
            sub={`${profitLoss.margin_percent.toFixed(1)}% margin`}
            icon={DollarSign}
            tone={profitLoss.net_profit >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryTile label="Filtered total" amount={summary?.total_cost ?? 0} tone="primary" loading={loadingSummary} />
        <SummaryTile label="Auto-recorded" amount={summary?.auto_total ?? 0} loading={loadingSummary} />
        <SummaryTile label="Manual entries" amount={summary?.manual_total ?? 0} loading={loadingSummary} />
        <SummaryTile label="Day-old Chicks" amount={summary?.by_category.find((c) => c.category === "chicks")?.total_cost ?? 0} loading={loadingSummary} />
        <SummaryTile label="Feed" amount={summary?.by_category.find((c) => c.category === "feed")?.total_cost ?? 0} loading={loadingSummary} />
        <SummaryTile label="Med + Vac" amount={
          (summary?.by_category.find((c) => c.category === "medication")?.total_cost ?? 0) +
          (summary?.by_category.find((c) => c.category === "vaccination")?.total_cost ?? 0)
        } loading={loadingSummary} />
      </div>

      {/* Analytics */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-600" />
                  Cost breakdown
                </CardTitle>
                <Tabs value={activeAnalyticsTab} onValueChange={(v) => setActiveAnalyticsTab(v as "breakdown" | "trend")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="breakdown" className="text-xs px-2">Category</TabsTrigger>
                    <TabsTrigger value="trend" className="text-xs px-2">Trend</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {activeAnalyticsTab === "breakdown" ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ChartContainer config={{}} className="h-[220px] w-full sm:w-1/2">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {chartData.map((entry) => (
                          <Cell key={entry.category} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex-1 space-y-2 w-full">
                    {topCategories.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatMoney(item.value)}</span>
                      </div>
                    ))}
                    {chartData.length > 4 && (
                      <p className="text-xs text-gray-500">+{chartData.length - 4} more categories</p>
                    )}
                  </div>
                </div>
              ) : (
                <ChartContainer config={{}} className="h-[220px] w-full">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => {
                        const d = new Date(`${v}T00:00:00`);
                        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      }}
                      fontSize={11}
                    />
                    <YAxis fontSize={11} tickFormatter={(v) => `${Naira}${(v / 1000).toFixed(0)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total_cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Category details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(summary?.by_category || []).map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{getCategoryLabel(item.category)}</span>
                      <span className="text-gray-600">
                        {formatMoney(item.total_cost)} · {item.percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: EXPENDITURE_CATEGORY_META[item.category]?.chartColor || "#9ca3af",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(summary?.by_category || []).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">No expenditure data for the selected filters.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <select
                className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
              >
                <option value="all">All time</option>
                <option value="this_month">This month</option>
                <option value="last_30">Last 30 days</option>
                <option value="last_90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {datePreset === "custom" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <select
                className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                {Object.keys(EXPENDITURE_CATEGORY_META).map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <select
                className="w-full border rounded-md px-2 py-2 text-sm bg-white"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as "all" | "auto" | "manual")}
              >
                <option value="all">All sources</option>
                <option value="auto">Auto-recorded</option>
                <option value="manual">Manual entries</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search description, reference, payment method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>
              Showing <strong>{filtered.length}</strong> of {expenditures.length} records
              {summary && <> · {summary.entry_count} in summary</>}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Auto</span>
              <span className="flex items-center gap-1"><Edit className="h-3 w-3 text-gray-500" /> Manual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger table */}
      {expenditures.length === 0 ? (
        <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 border rounded-lg px-4 py-4">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>
            No expenditure records yet. Costs are auto-created when you record feed usage, medication, or vaccinations — or add manual operational expenses like labour and transport.
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 border rounded-lg bg-gray-50">
          No expenditures match your filters.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[130px]">Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Payment</TableHead>
                <TableHead className="w-[120px] text-right">Amount</TableHead>
                <TableHead className="w-[130px]">Source</TableHead>
                {showActions && <TableHead className="w-[100px] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((e) => (
                <TableRow key={e.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-sm">
                    {onUpdateExpenditure ? (
                      <button
                        type="button"
                        onClick={() => { setEditingExpenditure(e); setIsModalOpen(true); }}
                        className="text-emerald-700 hover:underline"
                      >
                        {formatDate(e.date)}
                      </button>
                    ) : (
                      formatDate(e.date)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getCategoryBadgeClass(e.category)}`}>
                      {getCategoryLabel(e.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-800">{e.description || "—"}</div>
                    {e.reference_no && (
                      <div className="text-xs text-gray-500 mt-0.5">Ref: {e.reference_no}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 capitalize">
                    {e.payment_method?.replace(/_/g, " ") || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {formatMoney(e.amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isManualExpenditure(e.source_type)
                          ? "bg-gray-50 text-gray-700"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isManualExpenditure(e.source_type) ? "Manual" : "Auto"}
                    </Badge>
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {onUpdateExpenditure && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => { setEditingExpenditure(e); setIsModalOpen(true); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDeleteExpenditure && isManualExpenditure(e.source_type) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingExpenditure(e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length > ROWS_PER_PAGE && (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-3">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddFlockExpenditureModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpenditure(null); }}
        editing={editingExpenditure}
        dateOnly={editingExpenditure ? !isManualExpenditure(editingExpenditure.source_type) : false}
        onSubmit={editingExpenditure && onUpdateExpenditure
          ? (payload) => onUpdateExpenditure(editingExpenditure.id, payload)
          : onAddExpenditure!
        }
      />

      <DeleteConfirmationDialog
        isOpen={Boolean(deletingExpenditure)}
        onClose={() => setDeletingExpenditure(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete expenditure"
        description={`Delete this manual expenditure of ${deletingExpenditure ? formatMoney(deletingExpenditure.amount) : ""}? This cannot be undone.`}
        itemName={deletingExpenditure?.description || getCategoryLabel(deletingExpenditure?.category || "")}
        isLoading={isDeleting}
      />
    </div>
  );
};

const SummaryTile = ({
  label,
  amount,
  tone = "default",
  loading = false,
}: {
  label: string;
  amount: number;
  tone?: "default" | "primary";
  loading?: boolean;
}) => {
  const isPrimary = tone === "primary";
  return (
    <div className={`rounded-xl border px-3 py-3 ${isPrimary ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white" : "bg-white"}`}>
      <span className={`text-xs font-medium ${isPrimary ? "text-emerald-50" : "text-gray-500"}`}>{label}</span>
      <div className="text-lg font-bold mt-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(amount)}
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  tone: "positive" | "negative";
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`text-xl font-bold ${tone === "positive" ? "text-emerald-600" : "text-red-600"}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${tone === "positive" ? "bg-emerald-50" : "bg-red-50"}`}>
          <Icon className={`h-5 w-5 ${tone === "positive" ? "text-emerald-600" : "text-red-600"}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default FlockExpenditureView;
