import { useCallback, useRef, useState } from "react"
import { getFlockAllocations } from "@/lib/request"
import { getHouseEggLayout } from "@/lib/eggCollection"
import { confirmDialog } from "@/lib/confirmDialog"
import type { PoultryHouse } from "@/lib/types"

type TransferLine = { from_house_id?: number | null; to_house_id?: number | null; quantity: number }

type LayoutTarget = { house: PoultryHouse; notice: string }

/**
 * After a bird transfer, cells in the houses involved are still assigned as before, so the egg sheet
 * would miss the new house (or keep showing the emptied one). This checks each house that has a cell
 * layout and offers to open its layout so the user can assign or release cells.
 */
export function useTransferCellPrompt(opts: {
  token: string | null | undefined
  farmId: number | null | undefined
  flockId: number
  flockName: string
  enabled: boolean
}) {
  const { token, farmId, flockId, flockName, enabled } = opts
  const [target, setTarget] = useState<LayoutTarget | null>(null)
  const closeResolver = useRef<(() => void) | null>(null)

  const openLayout = (next: LayoutTarget) =>
    new Promise<void>((resolve) => {
      closeResolver.current = resolve
      setTarget(next)
    })

  const closeLayout = useCallback(() => {
    setTarget(null)
    closeResolver.current?.()
    closeResolver.current = null
  }, [])

  const afterTransfer = useCallback(
    async (lines: TransferLine[]) => {
      if (!enabled || !token || !farmId) return

      const toIds = new Set(lines.map((l) => Number(l.to_house_id)).filter(Boolean))
      const fromIds = new Set(lines.map((l) => Number(l.from_house_id)).filter(Boolean))
      const houseIds = [...new Set([...toIds, ...fromIds])]
      if (!houseIds.length) return

      const allocRes = await getFlockAllocations(token, farmId, flockId)
      const alloc = new Map<number, number>()
      if (allocRes.success && Array.isArray(allocRes.data)) {
        allocRes.data.forEach((a) => alloc.set(Number(a.house_id), Number(a.quantity || 0)))
      }

      for (const houseId of houseIds) {
        const res = await getHouseEggLayout(token, farmId, houseId)
        if (!res.success || !res.data || res.data.rows.length === 0) continue
        const layout = res.data
        const house = { id: layout.house.id, name: layout.house.name } as PoultryHouse
        const mine = layout.flocks.find((f) => f.id === flockId)
        const birdsHere = alloc.get(houseId) ?? 0
        const cellBirds = mine?.birds ?? 0
        const cells = mine?.cells ?? 0

        if (toIds.has(houseId) && birdsHere > 0 && cellBirds < birdsHere) {
          const free = layout.summary.unassigned_cells
          const ok = await confirmDialog({
            title: `Assign cells in ${layout.house.name}?`,
            description:
              `${birdsHere.toLocaleString()} birds of ${flockName} are now in ${layout.house.name}, ` +
              (cells
                ? `but only ${cells} cells (${cellBirds.toLocaleString()} birds) are assigned to this flock.`
                : "but no cells there are assigned to this flock yet.") +
              ` Egg recording by cell only covers assigned cells. ${free} cells in this house are unassigned.`,
            confirmLabel: "Assign cells",
            cancelLabel: "Later",
            tone: "flock",
          })
          if (ok) {
            await openLayout({
              house,
              notice: `Select the cells ${flockName} moved into (shift-click selects a range), then press Assign. ${flockName} is already chosen.`,
            })
          }
        } else if (fromIds.has(houseId) && birdsHere === 0 && cells > 0) {
          const ok = await confirmDialog({
            title: `Release cells in ${layout.house.name}?`,
            description: `No birds of ${flockName} are left in ${layout.house.name}, but ${cells} cells there are still assigned to it, so they keep showing on its egg sheet.`,
            confirmLabel: "Open layout",
            cancelLabel: "Keep them",
            tone: "flock",
          })
          if (ok) {
            await openLayout({
              house,
              notice: `Select ${flockName}'s cells and press Unassign, or assign them to the flock that uses them now.`,
            })
          }
        }
      }
    },
    [enabled, token, farmId, flockId, flockName]
  )

  return {
    afterTransfer,
    layoutModal: {
      isOpen: target !== null,
      house: target?.house ?? null,
      notice: target?.notice ?? null,
      defaultFlockId: flockId,
      onClose: closeLayout,
    },
  }
}
