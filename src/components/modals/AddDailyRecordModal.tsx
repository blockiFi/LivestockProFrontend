import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Loader2, Plus } from "lucide-react"
import type { FeedInventoryType, FeedType, PoultryDailyReport } from "@/lib/types"
import DailyRecordEntryRow from "./DailyRecordEntryRow"
import {
  type DailyRecordFormData,
  initialFormState,
  recordToFormData,
  toFormDate,
  validateDailyRecordEntry,
} from "./dailyRecordForm"

export type { DailyRecordFormData }

export interface BatchSubmitResult {
  succeeded: number
  failed: Array<{ index: number; date: string; error: string }>
}

interface AddDailyRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    records: DailyRecordFormData[],
    options?: { recordId?: number }
  ) => Promise<BatchSubmitResult | void>
  flockId: number
  flockQuantity: number
  farmId: number
  token: string
  poultryType: string
  flockArrivalDate?: string
  flockArrivalAgeDays?: number
  feedInventories?: FeedInventoryType[]
  feedTypes?: FeedType[]
  editingRecord?: PoultryDailyReport | null
  /** Inventory already linked to feed usage for the editing record's date */
  editingInventoryId?: number | null
  existingRecordDates?: string[]
}

const AddDailyRecordModal = ({
  isOpen,
  onClose,
  onSubmit,
  flockId,
  flockQuantity,
  farmId,
  token,
  poultryType,
  flockArrivalDate,
  flockArrivalAgeDays = 0,
  feedInventories = [],
  feedTypes = [],
  editingRecord = null,
  editingInventoryId = null,
  existingRecordDates = [],
}: AddDailyRecordModalProps) => {
  const isEditMode = Boolean(editingRecord)
  const [entries, setEntries] = useState<DailyRecordFormData[]>([initialFormState(flockId)])
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({})
  const [submitErrors, setSubmitErrors] = useState<Record<number, string>>({})
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({ 0: true })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingDatesSet = useMemo(() => {
    const dates = new Set(existingRecordDates.map((d) => toFormDate(d)))
    if (editingRecord) {
      dates.delete(toFormDate(editingRecord.date))
    }
    return dates
  }, [existingRecordDates, editingRecord])

  const batchDates = useMemo(() => entries.map((e) => e.date).filter(Boolean), [entries])

  useEffect(() => {
    if (!isOpen) return

    if (editingRecord) {
      setEntries([recordToFormData(editingRecord, flockId, editingInventoryId)])
      setExpandedRows({ 0: true })
    } else {
      setEntries([initialFormState(flockId)])
      setExpandedRows({ 0: true })
    }
    setEntryErrors({})
    setSubmitErrors({})
  }, [isOpen, editingRecord, flockId, editingInventoryId])

  const handleEntryChange = (index: number, patch: Partial<DailyRecordFormData>) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  const handleClearError = (index: number, field: keyof DailyRecordFormData) => {
    setEntryErrors((prev) => {
      if (!prev[index]?.[field]) return prev
      const { [field]: _, ...rest } = prev[index]
      return { ...prev, [index]: rest }
    })
    setSubmitErrors((prev) => {
      if (!prev[index]) return prev
      const { [index]: _, ...rest } = prev
      return rest
    })
  }

  const validateAllEntries = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {}
    entries.forEach((entry, index) => {
      const errors = validateDailyRecordEntry(entry, flockQuantity, poultryType, {
        existingDates: existingDatesSet,
        duplicateDatesInBatch: batchDates,
      })
      if (Object.keys(errors).length > 0) {
        newErrors[index] = errors
      }
    })
    setEntryErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddEntry = () => {
    const nextIndex = entries.length
    setEntries((prev) => [...prev, initialFormState(flockId, "")])
    setExpandedRows((prev) => ({ ...prev, [nextIndex]: true }))
  }

  const handleRemoveEntry = (index: number) => {
    if (entries.length <= 1) return
    setEntries((prev) => prev.filter((_, i) => i !== index))
    setEntryErrors((prev) => {
      const next: Record<number, Record<string, string>> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key)
        if (i < index) next[i] = value
        if (i > index) next[i - 1] = value
      })
      return next
    })
    setSubmitErrors((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key)
        if (i < index) next[i] = value
        if (i > index) next[i - 1] = value
      })
      return next
    })
    setExpandedRows((prev) => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key)
        if (i < index) next[i] = value
        if (i > index) next[i - 1] = value
      })
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAllEntries()) return

    setIsSubmitting(true)
    setSubmitErrors({})

    try {
      if (isEditMode) {
        await onSubmit(entries, { recordId: editingRecord!.id })
        onClose()
        return
      }

      const result = await onSubmit(entries)
      if (!result) {
        onClose()
        return
      }

      if (result.failed.length === 0) {
        onClose()
        return
      }

      const sortedFailures = [...result.failed].sort((a, b) => a.index - b.index)
      const failedEntries = sortedFailures.map((failure) => entries[failure.index]).filter(Boolean)

      const newSubmitErrors: Record<number, string> = {}
      sortedFailures.forEach((failure, newIndex) => {
        newSubmitErrors[newIndex] = failure.error
      })

      setEntries(failedEntries.length > 0 ? failedEntries : entries)
      setSubmitErrors(newSubmitErrors)
      setExpandedRows(
        failedEntries.reduce<Record<number, boolean>>((acc, _, index) => {
          acc[index] = true
          return acc
        }, {})
      )
    } catch (error) {
      console.error("Error saving daily record(s):", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEntries([initialFormState(flockId)])
      setEntryErrors({})
      setSubmitErrors({})
      setExpandedRows({ 0: true })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) handleClose()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {isEditMode ? "Edit Daily Record" : "Add Daily Records"}
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              {isEditMode
                ? "Update the metrics for this daily record."
                : "Add one or more daily records. Each row is a different date. Records are saved oldest-first."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-3 pt-2">
            {entries.map((entry, index) => (
              <DailyRecordEntryRow
                key={index}
                rowIndex={index}
                data={entry}
                errors={entryErrors[index] ?? {}}
                submitError={submitErrors[index]}
                onChange={(patch) => handleEntryChange(index, patch)}
                onClearError={(field) => handleClearError(index, field)}
                flockId={flockId}
                flockQuantity={flockQuantity}
                farmId={farmId}
                token={token}
                poultryType={poultryType}
                flockArrivalDate={flockArrivalDate}
                flockArrivalAgeDays={flockArrivalAgeDays}
                feedInventories={feedInventories}
                feedTypes={feedTypes}
                isActive={isOpen}
                expanded={expandedRows[index] ?? false}
                onToggleExpand={() => setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }))}
                onRemove={() => handleRemoveEntry(index)}
                canRemove={!isEditMode && entries.length > 1}
                skipAutoFill={isEditMode}
              />
            ))}
          </div>

          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEntry}
              className="w-full border-dashed"
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another date
            </Button>
          )}

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Record"
                  : entries.length > 1
                    ? `Save all ${entries.length} records`
                    : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddDailyRecordModal
