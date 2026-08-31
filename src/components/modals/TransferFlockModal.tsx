import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import { Plus, Trash2 } from "lucide-react"
import type { PoultryHouse } from "@/lib/types"
import { createFlockTransfer, getPoultryHouses } from "@/lib/request"

type Mode = "move" | "split" | "merge"

export default function TransferFlockModal(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  farmId: number
  flockId: number
  allocations: Array<{ house_id: number; quantity: number; house?: any }>
  onSuccess: () => void
}) {
  const { open, onOpenChange, token, farmId, flockId, allocations, onSuccess } = props
  const [mode, setMode] = useState<Mode>("move")
  const [houses, setHouses] = useState<PoultryHouse[]>([])
  const [transferDate, setTransferDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [fromHouseId, setFromHouseId] = useState<string>("")
  const [toHouseId, setToHouseId] = useState<string>("")
  const [qty, setQty] = useState<string>("")
  const [splitLines, setSplitLines] = useState<Array<{ to_house_id: string; quantity: string }>>([
    { to_house_id: "", quantity: "" },
  ])
  const [mergeLines, setMergeLines] = useState<Array<{ from_house_id: string; quantity: string }>>([
    { from_house_id: "", quantity: "" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!open) return
      const res = await getPoultryHouses(token, farmId)
      if (res.success && Array.isArray(res.data)) setHouses(res.data)
    }
    load()
  }, [open, token, farmId])

  const allocationMap = useMemo(() => {
    const m = new Map<number, number>()
    allocations.forEach((a) => m.set(Number(a.house_id), Number(a.quantity || 0)))
    return m
  }, [allocations])

  const submit = async () => {
    setIsSubmitting(true)
    try {
      if (!transferDate) {
        toast.error("Transfer date is required")
        return
      }

      let lines: Array<{ from_house_id?: number | null; to_house_id?: number | null; quantity: number }> = []

      if (mode === "move") {
        const from = Number(fromHouseId)
        const to = Number(toHouseId)
        const q = Number(qty)
        if (!from || !to) return toast.error("Select from and to houses")
        if (!Number.isFinite(q) || q <= 0) return toast.error("Quantity must be > 0")
        if (q > (allocationMap.get(from) ?? 0)) return toast.error("Not enough birds in the source house")
        lines = [{ from_house_id: from, to_house_id: to, quantity: q }]
      }

      if (mode === "split") {
        const from = Number(fromHouseId)
        if (!from) return toast.error("Select a source house")
        const available = allocationMap.get(from) ?? 0
        const cleaned = splitLines
          .map((l) => ({ to: Number(l.to_house_id), q: Number(l.quantity) }))
          .filter((l) => l.to && Number.isFinite(l.q) && l.q > 0)
        if (cleaned.length < 1) return toast.error("Add at least one destination line")
        const total = cleaned.reduce((s, l) => s + l.q, 0)
        if (total > available) return toast.error("Split quantity exceeds available birds")
        lines = cleaned.map((l) => ({ from_house_id: from, to_house_id: l.to, quantity: l.q }))
      }

      if (mode === "merge") {
        const to = Number(toHouseId)
        if (!to) return toast.error("Select a destination house")
        const cleaned = mergeLines
          .map((l) => ({ from: Number(l.from_house_id), q: Number(l.quantity) }))
          .filter((l) => l.from && Number.isFinite(l.q) && l.q > 0)
        if (cleaned.length < 1) return toast.error("Add at least one source line")
        for (const l of cleaned) {
          if (l.q > (allocationMap.get(l.from) ?? 0)) return toast.error("One of the source houses does not have enough birds")
        }
        lines = cleaned.map((l) => ({ from_house_id: l.from, to_house_id: to, quantity: l.q }))
      }

      const res = await createFlockTransfer(token, farmId, flockId, {
        transfer_date: transferDate,
        note: note || null,
        lines,
      })

      if (res.success) {
        toast.success("Transfer applied")
        onOpenChange(false)
        onSuccess()
      } else {
        if (Array.isArray(res.error)) {
          res.error.forEach((e) => toast.error(e))
        } else if (res.error) {
          toast.error(String(res.error))
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForMode = (m: Mode) => {
    setMode(m)
    setFromHouseId("")
    setToHouseId("")
    setQty("")
    setSplitLines([{ to_house_id: "", quantity: "" }])
    setMergeLines([{ from_house_id: "", quantity: "" }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transfer birds</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Transfer date</Label>
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => resetForMode(v as Mode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">Move</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                  <SelectItem value="merge">Merge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or context..." />
          </div>

          {(mode === "move" || mode === "split") && (
            <div className="space-y-2">
              <Label>From house</Label>
              <Select value={fromHouseId} onValueChange={setFromHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source house" />
                </SelectTrigger>
                <SelectContent>
                  {allocations.map((a) => (
                    <SelectItem key={a.house_id} value={String(a.house_id)}>
                      {a.house?.name ?? `House #${a.house_id}`} ({Number(a.quantity || 0).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(mode === "move" || mode === "merge") && (
            <div className="space-y-2">
              <Label>To house</Label>
              <Select value={toHouseId} onValueChange={setToHouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination house" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "move" && (
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 250" />
            </div>
          )}

          {mode === "split" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Split lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSplitLines((p) => [...p, { to_house_id: "", quantity: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </Button>
              </div>
              <div className="space-y-2">
                {splitLines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_140px_40px] gap-2">
                    <Select
                      value={l.to_house_id}
                      onValueChange={(v) =>
                        setSplitLines((p) => p.map((x, i) => (i === idx ? { ...x, to_house_id: v } : x)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {houses.map((h) => (
                          <SelectItem key={h.id} value={String(h.id)}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={l.quantity}
                      onChange={(e) =>
                        setSplitLines((p) => p.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))
                      }
                      placeholder="Qty"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSplitLines((p) => p.filter((_, i) => i !== idx))}
                      disabled={splitLines.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "merge" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Merge lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setMergeLines((p) => [...p, { from_house_id: "", quantity: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </Button>
              </div>
              <div className="space-y-2">
                {mergeLines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_140px_40px] gap-2">
                    <Select
                      value={l.from_house_id}
                      onValueChange={(v) =>
                        setMergeLines((p) => p.map((x, i) => (i === idx ? { ...x, from_house_id: v } : x)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {allocations.map((a) => (
                          <SelectItem key={a.house_id} value={String(a.house_id)}>
                            {a.house?.name ?? `House #${a.house_id}`} ({Number(a.quantity || 0).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={l.quantity}
                      onChange={(e) =>
                        setMergeLines((p) => p.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))
                      }
                      placeholder="Qty"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setMergeLines((p) => p.filter((_, i) => i !== idx))}
                      disabled={mergeLines.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={isSubmitting} onClick={submit}>
              {isSubmitting ? "Applying..." : "Apply transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

