import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DashboardFlockRow } from "@/lib/types"
import { formatCount, formatMoney } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { ExportDataButton } from "@/components/general/ExportDataButton"
import { buildExportFilename, type ExportColumn } from "@/lib/exportData"

const LEADERBOARD_COLUMNS: ExportColumn<DashboardFlockRow>[] = [
  { header: "Flock", value: (row) => row.name },
  { header: "Batch", value: (row) => row.batch_number || "" },
  { header: "Type", value: (row) => row.poultry_type },
  { header: "Status", value: (row) => row.status },
  { header: "Birds", value: (row) => row.birds },
  { header: "Age (days)", value: (row) => row.age_days },
  { header: "Mortality %", value: (row) => row.mortality_percent },
  { header: "FCR", value: (row) => row.fcr },
  { header: "Feed cost", value: (row) => row.feed_cost },
  { header: "Revenue", value: (row) => row.revenue },
  { header: "Net profit", value: (row) => row.net_profit },
]

type SortKey = keyof Pick<
  DashboardFlockRow,
  "name" | "birds" | "age_days" | "mortality_percent" | "fcr" | "feed_cost" | "revenue" | "net_profit"
>

type Props = {
  flocks: DashboardFlockRow[]
}

const FlockLeaderboard = ({ flocks }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("net_profit")
  const [asc, setAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...flocks]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === "string" && typeof bv === "string") {
        return asc ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return asc ? Number(av) - Number(bv) : Number(bv) - Number(av)
    })
    return copy
  }, [flocks, sortKey, asc])

  const toggle = (key: SortKey) => {
    if (sortKey === key) setAsc(!asc)
    else {
      setSortKey(key)
      setAsc(false)
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
    return asc ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    )
  }

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Flock leaderboard</CardTitle>
          <CardDescription>Performance by flock for the selected period</CardDescription>
        </div>
        <ExportDataButton
          rows={sorted}
          columns={LEADERBOARD_COLUMNS}
          filename={buildExportFilename("flock-leaderboard")}
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {flocks.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No flocks on this farm.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button type="button" className="font-medium" onClick={() => toggle("name")}>
                    Flock <SortIcon k="name" />
                  </button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("birds")}>
                    Birds <SortIcon k="birds" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("age_days")}>
                    Age <SortIcon k="age_days" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("mortality_percent")}>
                    Mort % <SortIcon k="mortality_percent" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("fcr")}>
                    FCR <SortIcon k="fcr" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("feed_cost")}>
                    Feed cost <SortIcon k="feed_cost" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("revenue")}>
                    Revenue <SortIcon k="revenue" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button type="button" onClick={() => toggle("net_profit")}>
                    Profit <SortIcon k="net_profit" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/dashboard/poultry/flock-management/${f.id}`}
                      className="text-teal-700 hover:underline"
                    >
                      {f.name}
                    </Link>
                    {f.batch_number ? (
                      <span className="ml-1 text-xs text-slate-400">#{f.batch_number}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{f.poultry_type}</TableCell>
                  <TableCell className="capitalize">{f.status}</TableCell>
                  <TableCell className="text-right">{formatCount(f.birds)}</TableCell>
                  <TableCell className="text-right">{formatCount(f.age_days)}d</TableCell>
                  <TableCell className="text-right">{f.mortality_percent.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">{f.fcr.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatMoney(f.feed_cost)}</TableCell>
                  <TableCell className="text-right">{formatMoney(f.revenue)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(f.net_profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default FlockLeaderboard
