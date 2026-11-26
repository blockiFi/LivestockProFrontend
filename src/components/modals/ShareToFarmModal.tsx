import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Search, Send, Share2, Warehouse } from "lucide-react"
import { AppModal } from "@/components/ui/app-modal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  getShareTargetFarms,
  lookupFarmByShareCode,
  sendShareToFarm,
  shareToFarms,
  type ShareKind,
  type ShareResult,
  type ShareTargetFarm,
} from "@/lib/request"

const kindLabel: Record<ShareKind, string> = {
  schedule: "schedule",
  feeding_schedule: "feeding schedule",
  feed_product: "feed formulation",
}

type ShareToFarmModalProps = {
  open: boolean
  onClose: () => void
  token: string
  farmId: number
  kind: ShareKind
  itemId: number
  itemName: string
}

/**
 * Shares a schedule or feed formulation with another farm: either an instant
 * copy into the user's own other farms (where they can create that kind of
 * item), or a request sent by farm share code that the other farm accepts.
 */
export function ShareToFarmModal({ open, onClose, token, farmId, kind, itemId, itemName }: ShareToFarmModalProps) {
  const [farms, setFarms] = useState<ShareTargetFarm[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ShareResult[] | null>(null)
  const [mode, setMode] = useState<"mine" | "code">("mine")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [found, setFound] = useState<{ id: number; name: string } | null>(null)
  const [looking, setLooking] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected([])
    setResults(null)
    setError(null)
    setCode("")
    setMessage("")
    setFound(null)
    setSentTo(null)
    setLoading(true)
    getShareTargetFarms(token, farmId, kind)
      .then((res) => {
        if (res.success) {
          setFarms(res.data ?? [])
          if ((res.data ?? []).length === 0) setMode("code")
        }
        else setError(res.error?.join(" ") || "Could not load your other farms")
      })
      .finally(() => setLoading(false))
  }, [open, token, farmId, kind])

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const handleShare = async () => {
    if (selected.length === 0) return
    setSharing(true)
    setError(null)
    const res = await shareToFarms(token, farmId, { kind, id: itemId, target_farm_ids: selected })
    setSharing(false)
    if (res.success) setResults(res.data ?? [])
    else setError(res.error?.join(" ") || "Sharing failed")
  }

  const handleLookup = async () => {
    const clean = code.trim()
    if (!clean) return
    setLooking(true)
    setError(null)
    setFound(null)
    const res = await lookupFarmByShareCode(token, farmId, clean)
    setLooking(false)
    if (res.success && res.data) setFound(res.data)
    else setError(res.error?.join(" ") || "No farm has that share code")
  }

  const handleSend = async () => {
    if (!found) return
    setSharing(true)
    setError(null)
    const res = await sendShareToFarm(token, farmId, {
      kind,
      id: itemId,
      farm_code: code.trim(),
      message: message.trim() || undefined,
    })
    setSharing(false)
    if (res.success) setSentTo(found.name)
    else setError(res.error?.join(" ") || "Sending failed")
  }

  const label = kindLabel[kind]

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      title={
        <span className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-emerald-600" />
          Share to another farm
        </span>
      }
      description={
        <>
          Send a copy of <span className="font-medium text-slate-700">“{itemName}”</span> to another farm. Later
          changes on either farm stay separate.
        </>
      }
    >
      {sentTo ? (
        <div className="space-y-4" data-testid="share-sent">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sent to <span className="font-medium">{sentTo}</span>. An owner or manager there will see it under
              Shared Items and can accept or decline it. You can follow it on your own Shared Items page.
            </span>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : results ? (
        <div className="space-y-4" data-testid="share-results">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Shared to {results.length} {results.length === 1 ? "farm" : "farms"}.
            </span>
          </div>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.farm_id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-medium text-slate-900">{r.farm_name}</p>
                <p className="text-xs text-slate-500">Saved as “{r.name}”</p>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            {([
              ["mine", "My other farms"],
              ["code", "Another farm (code)"],
            ] as const).map(([value, text]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value)
                  setError(null)
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {text}
              </button>
            ))}
          </div>

          {mode === "code" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-700">Farm share code</p>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase())
                      setFound(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLookup()
                    }}
                    placeholder="e.g. K7PM2QXA"
                    className="font-mono tracking-widest uppercase"
                    maxLength={16}
                  />
                  <Button type="button" variant="outline" onClick={handleLookup} disabled={!code.trim() || looking} className="gap-1.5">
                    {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Find
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Ask the other farm for the code on their Shared Items page.
                </p>
              </div>

              {found ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <Warehouse className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-900 font-medium">{found.name}</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-700">Note (optional)</p>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Anything they should know about it"
                    />
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onClose} disabled={sharing}>
                  Cancel
                </Button>
                <Button onClick={handleSend} disabled={!found || sharing} className="gap-2">
                  {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send for approval
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your farms…
                </div>
              ) : farms.length === 0 && !error ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                  <Warehouse className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                  You have no other farm where you can add a {label} yourself. Use “Another farm (code)” to send it
                  to a farm for them to accept.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Choose farms</p>
                  {farms.map((farm) => {
                    const checked = selected.includes(farm.id)
                    return (
                      <label
                        key={farm.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <Checkbox checked={checked} onCheckedChange={(v) => toggle(farm.id, v === true)} />
                        <span className="text-slate-900">{farm.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onClose} disabled={sharing}>
                  Cancel
                </Button>
                <Button onClick={handleShare} disabled={selected.length === 0 || sharing} className="gap-2">
                  {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  Share{selected.length > 0 ? ` to ${selected.length}` : ""}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppModal>
  )
}

export default ShareToFarmModal
