import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Plus, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { RootState } from "@/store"
import type { Customer } from "@/lib/types"
import { getCustomers } from "@/lib/crmRequest"
import CustomerFormSheet from "@/components/crm/CustomerFormSheet"

export type CustomerSelection = {
  customer_id: number | null
  customer_name: string
  customer_phone: string
}

type Props = {
  value: CustomerSelection
  onChange: (value: CustomerSelection) => void
  disabled?: boolean
}

export default function CustomerPicker({ value, onChange, disabled }: Props) {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [walkInName, setWalkInName] = useState(value.customer_name)
  const [walkInPhone, setWalkInPhone] = useState(value.customer_phone)

  const loadCustomers = async () => {
    if (!token || !farmId) return
    setLoading(true)
    const res = await getCustomers(token, farmId, { active: true, search: search || undefined })
    if (res.success && res.data) setCustomers(res.data)
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    void loadCustomers()
  }, [open, search, token, farmId])

  useEffect(() => {
    setWalkInName(value.customer_name)
    setWalkInPhone(value.customer_phone)
  }, [value.customer_name, value.customer_phone])

  const selectedLabel = useMemo(() => {
    if (value.customer_id) {
      const match = customers.find((customer) => customer.id === value.customer_id)
      return match?.name ?? value.customer_name ?? "Selected customer"
    }
    if (value.customer_name) return `${value.customer_name} (walk-in)`
    return "Select customer"
  }, [customers, value])

  const selectCustomer = (customer: Customer) => {
    onChange({
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone ?? "",
    })
    setOpen(false)
  }

  const applyWalkIn = () => {
    onChange({
      customer_id: null,
      customer_name: walkInName.trim(),
      customer_phone: walkInPhone.trim(),
    })
    setOpen(false)
  }

  const openCreateSheet = () => {
    // Close the picker first so Sheet is not nested under a modal Popover + Dialog.
    setOpen(false)
    // Defer so Popover unmounts before Sheet opens (avoids focus-trap deadlocks).
    window.setTimeout(() => setCreateOpen(true), 0)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Customer</Label>
        <Popover modal open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start" disabled={disabled}>
              <UserRound className="mr-2 h-4 w-4" />
              {selectedLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="z-[200] w-80 p-3"
            align="start"
            side="bottom"
            sideOffset={6}
            collisionPadding={16}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-3">
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {loading ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Loading customers...</p>
                ) : customers.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No customers found.</p>
                ) : (
                  customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full flex-col rounded-md px-2 py-2 text-left hover:bg-slate-100"
                      // pointerdown + preventDefault avoids Dialog/Popover focus steal eating the click
                      onPointerDown={(e) => {
                        e.preventDefault()
                        selectCustomer(customer)
                      }}
                    >
                      <span className="text-sm font-medium">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact details"}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onPointerDown={(e) => {
                  e.preventDefault()
                  openCreateSheet()
                }}
              >
                <Plus className="h-4 w-4" />
                Quick add customer
              </Button>
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Or use walk-in details</p>
                <Input
                  placeholder="Walk-in name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Input
                  placeholder="Walk-in phone"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    applyWalkIn()
                  }}
                >
                  Use walk-in customer
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <CustomerFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(customer) => {
          selectCustomer(customer)
          setCreateOpen(false)
        }}
      />
    </div>
  )
}
