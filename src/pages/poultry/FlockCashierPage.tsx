import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddFlockSaleModal, { type FlockSaleFormPayload } from "@/components/modals/AddFlockSaleModal"
import { createFlockSale, getFlocks } from "@/lib/request"
import type { FlockRecord } from "@/lib/types"
import type { RootState } from "@/store"
import { formatDate, getDaysInFlock, isFlockActive } from "@/lib/utils"
import {
  Bird,
  Calendar,
  ExternalLink,
  Lock,
  Search,
  ShoppingBag,
} from "lucide-react"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

const FlockCashierPage = () => {
  const navigate = useNavigate()
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)

  const [flocks, setFlocks] = useState<FlockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFlock, setSelectedFlock] = useState<FlockRecord | null>(null)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)

  const refreshFlocks = useCallback(async () => {
    if (!farmId || !token) return
    setLoading(true)
    try {
      const response = await getFlocks(token, farmId, false)
      if (response.success && Array.isArray(response.data)) {
        setFlocks(response.data)
      } else {
        setFlocks([])
      }
    } finally {
      setLoading(false)
    }
  }, [farmId, token])

  useEffect(() => {
    refreshFlocks()
  }, [refreshFlocks])

  const activeFlocks = useMemo(
    () =>
      flocks.filter(
        (flock) => isFlockActive(flock.status) && Number(flock.actual_quantity || 0) > 0
      ),
    [flocks]
  )

  const endedFlocks = useMemo(
    () => flocks.filter((flock) => !isFlockActive(flock.status)),
    [flocks]
  )

  const filterFlocks = (list: FlockRecord[]) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (flock) =>
        flock.name.toLowerCase().includes(q) ||
        flock.batch_number.toLowerCase().includes(q) ||
        flock.breed.toLowerCase().includes(q)
    )
  }

  const filteredActive = useMemo(() => filterFlocks(activeFlocks), [activeFlocks, searchTerm])
  const filteredEnded = useMemo(() => filterFlocks(endedFlocks), [endedFlocks, searchTerm])

  const openSaleModal = (flock: FlockRecord) => {
    setSelectedFlock(flock)
    setIsSaleModalOpen(true)
  }

  const closeSaleModal = () => {
    setIsSaleModalOpen(false)
    setSelectedFlock(null)
  }

  const handleRecordSale = async (payload: FlockSaleFormPayload) => {
    if (!farmId || !token || !selectedFlock) return

    const res = await createFlockSale(token, farmId, selectedFlock.id, payload)
    if (res.success) {
      closeSaleModal()
      await refreshFlocks()
      const updated = flocks.find((f) => f.id === selectedFlock.id)
      if (updated && !isFlockActive(updated.status) && Number(updated.actual_quantity) === 0) {
        toast.success("Sale recorded. Batch ended — all birds have been sold.")
      } else {
        toast.success("Sale recorded")
      }
    } else if (!res.success) {
      const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error)
      toast.error(msg)
    }
  }

  const renderFlockCard = (flock: FlockRecord, canSell: boolean) => {
    const daysInFlock = getDaysInFlock(
      flock.arrival_date,
      flock.actual_end_date,
      isFlockActive(flock.status)
    )

    return (
      <Card key={flock.id} className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{flock.name}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Batch {flock.batch_number} · {flock.breed}
              </p>
            </div>
            <Badge variant="outline" className="capitalize shrink-0">
              {flock.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-sky-50 border border-sky-100 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-sky-600">Live birds</p>
              <p className="font-bold text-sky-900 tabular-nums">
                {Number(flock.actual_quantity || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-amber-600">Days in flock</p>
              <p className="font-bold text-amber-900 tabular-nums">{daysInFlock}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Arrived {formatDate(flock.arrival_date)}</span>
            {flock.actual_end_date ? (
              <span>· Ended {formatDate(flock.actual_end_date)}</span>
            ) : null}
          </div>

          <div className="flex gap-2">
            {canSell ? (
              <ActionGate anyOf={ACTIONS.sales.create}>
                <Button
                  size="sm"
                  className="flex-1 bg-sky-600 hover:bg-sky-700"
                  onClick={() => openSaleModal(flock)}
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Record Sale
                </Button>
              </ActionGate>
            ) : (
              <div className="flex-1 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Batch ended — sales locked
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/dashboard/poultry/flock-management/${flock.id}`)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sales</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Live Bird Cashier</h1>
            <p className="text-sm text-slate-500 mt-1">
              Record live-bird sales for active batches. Ended batches are read-only.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Bird className="h-4 w-4" />
            <span>
              <strong>{activeFlocks.length}</strong> active batch
              {activeFlocks.length === 1 ? "" : "es"} available
            </span>
          </div>
        </div>

        <Card className="p-4 border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search batch, name, or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({filteredActive.length})</TabsTrigger>
            <TabsTrigger value="ended">Ended ({filteredEnded.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <p className="text-sm text-slate-500 py-8 text-center">Loading batches...</p>
            ) : filteredActive.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">No active batches with live birds to sell.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredActive.map((flock) => renderFlockCard(flock, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended" className="mt-4">
            {filteredEnded.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Lock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">No ended batches match your search.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEnded.map((flock) => renderFlockCard(flock, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedFlock && (
        <AddFlockSaleModal
          isOpen={isSaleModalOpen}
          onClose={closeSaleModal}
          onSubmit={handleRecordSale}
          liveBirdCount={selectedFlock.actual_quantity}
        />
      )}
    </div>
  )
}

export default FlockCashierPage
