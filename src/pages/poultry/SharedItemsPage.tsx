import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { ArrowDownLeft, ArrowUpRight, Check, Copy, Inbox, Loader2, Pill, Shield, UtensilsCrossed, Wheat, X } from "lucide-react"
import type { RootState } from "@/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  getFarmShareCode,
  getIncomingShares,
  getOutgoingShares,
  respondToShare,
  type FarmShareRecord,
} from "@/lib/request"

const statusStyle: Record<FarmShareRecord["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border-slate-200 bg-slate-50 text-slate-500",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
}

const statusText: Record<FarmShareRecord["status"], string> = {
  pending: "Waiting",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
}

function KindIcon({ share }: { share: FarmShareRecord }) {
  if (share.kind === "feed_product")
    return (
      <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
        <Wheat className="h-4 w-4" />
      </div>
    )
  if (share.kind === "feeding_schedule")
    return (
      <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
        <UtensilsCrossed className="h-4 w-4" />
      </div>
    )
  return share.item_subtype === "vaccination" ? (
    <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
      <Shield className="h-4 w-4" />
    </div>
  ) : (
    <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
      <Pill className="h-4 w-4" />
    </div>
  )
}

function whereItLives(share: FarmShareRecord) {
  return share.kind === "feed_product"
    ? { to: "/dashboard/poultry/feed/compositions", label: "Open Feed Composition" }
    : { to: "/dashboard/poultry/schedules", label: "Open Schedule Management" }
}

function formatDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function ShareRow({
  share,
  direction,
  busy,
  onAction,
}: {
  share: FarmShareRecord
  direction: "in" | "out"
  busy: boolean
  onAction: (share: FarmShareRecord, action: "accept" | "decline" | "cancel") => void
}) {
  const otherFarm = direction === "in" ? share.source_farm.name : share.target_farm.name
  const countLabel =
    share.kind === "feed_product"
      ? `${share.item_count} ${share.item_count === 1 ? "ingredient" : "ingredients"}`
      : `${share.item_count} ${share.item_count === 1 ? "item" : "items"}`

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start">
      <KindIcon share={share} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{share.item_name}</p>
          <Badge variant="outline" className={cn("font-normal", statusStyle[share.status])}>
            {statusText[share.status]}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          <span className="capitalize">{share.kind_label}</span> · {countLabel} ·{" "}
          {direction === "in" ? "from" : "to"} <span className="font-medium text-slate-700">{otherFarm}</span>
          {share.shared_by && direction === "in" ? ` (${share.shared_by.name})` : ""} · {formatDate(share.created_at)}
        </p>
        {share.message ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">“{share.message}”</p>
        ) : null}
        {share.status !== "pending" && share.responded_by ? (
          <p className="mt-1 text-xs text-slate-400">
            {statusText[share.status]} by {share.responded_by.name} on {formatDate(share.responded_at)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {direction === "in" && share.can_respond ? (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction(share, "decline")} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Decline
            </Button>
            <Button size="sm" disabled={busy} onClick={() => onAction(share, "accept")} className="gap-1.5">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
            </Button>
          </>
        ) : null}
        {direction === "in" && share.status === "pending" && !share.can_respond ? (
          <p className="text-xs text-slate-400">An owner or manager can accept this</p>
        ) : null}
        {direction === "in" && share.status === "accepted" ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={whereItLives(share).to}>{whereItLives(share).label}</Link>
          </Button>
        ) : null}
        {direction === "out" && share.status === "pending" ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onAction(share, "cancel")}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      <Inbox className="mx-auto mb-2 h-5 w-5 text-slate-400" />
      {text}
    </div>
  )
}

/** Schedules and feed formulations other farms have sent to this farm, and what this farm has sent. */
export default function SharedItemsPage() {
  const token = useSelector((s: RootState) => s.authentication.token)
  const farmId = useSelector((s: RootState) => s.authentication.activeFarm?.id)
  const [code, setCode] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<FarmShareRecord[] | null>(null)
  const [outgoing, setOutgoing] = useState<FarmShareRecord[] | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [tab, setTab] = useState("incoming")

  const load = useCallback(async () => {
    if (!token || !farmId) return
    const [codeRes, inRes, outRes] = await Promise.all([
      getFarmShareCode(token, farmId),
      getIncomingShares(token, farmId),
      getOutgoingShares(token, farmId),
    ])
    if (codeRes.success && codeRes.data) setCode(codeRes.data.code)
    setIncoming(inRes.success ? inRes.data ?? [] : [])
    setOutgoing(outRes.success ? outRes.data ?? [] : [])
  }, [token, farmId])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (share: FarmShareRecord, action: "accept" | "decline" | "cancel") => {
    if (!token || !farmId) return
    setBusyId(share.id)
    const res = await respondToShare(token, farmId, share.id, action)
    setBusyId(null)
    if (!res.success) {
      toast.error(res.error?.join(" ") || "That did not work")
      return
    }
    if (action === "accept") toast.success(`Added “${res.data?.copy?.name ?? share.item_name}” to this farm`)
    if (action === "decline") toast.info(`Declined “${share.item_name}”`)
    if (action === "cancel") toast.info(`Cancelled sending “${share.item_name}”`)
    load()
  }

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Share code copied")
    } catch {
      toast.info(code)
    }
  }

  const pendingCount = incoming?.filter((s) => s.status === "pending").length ?? 0

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shared Items</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Schedules and feed formulations shared between this farm and other farms
          </p>
        </div>

        {code ? (
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">This farm's share code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Give this code to another farm so they can send you a schedule or feed formulation.
              </p>
              <div className="flex items-center gap-2">
                <span
                  data-testid="share-code"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-lg tracking-[0.2em] text-slate-900"
                >
                  {code}
                </span>
                <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto rounded-lg bg-slate-100 p-1">
            <TabsTrigger value="incoming" className="gap-1.5">
              <ArrowDownLeft className="h-4 w-4" /> Received
              {pendingCount > 0 ? (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">{pendingCount}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-1.5">
              <ArrowUpRight className="h-4 w-4" /> Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4 space-y-3">
            {incoming === null ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : incoming.length === 0 ? (
              <EmptyList text="Nothing has been shared with this farm yet." />
            ) : (
              incoming.map((s) => (
                <ShareRow key={s.id} share={s} direction="in" busy={busyId === s.id} onAction={handleAction} />
              ))
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4 space-y-3">
            {outgoing === null ? (
              <div className="flex justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : outgoing.length === 0 ? (
              <EmptyList text="Use Share on a schedule or feed formulation to send it to another farm." />
            ) : (
              outgoing.map((s) => (
                <ShareRow key={s.id} share={s} direction="out" busy={busyId === s.id} onAction={handleAction} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
