import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { formInputClass } from "../ui/form-modal"

export type InlineAddField = {
  key: string
  label: string
  placeholder?: string
  type?: "text" | "number"
  required?: boolean
}

type Props = {
  /** e.g. "medication type" or "vaccine"; used in the title and button. */
  noun: string
  fields: InlineAddField[]
  initialName?: string
  /** Resolve to an error message to show, or null on success. */
  onSave: (values: Record<string, string>) => Promise<string | null>
  onCancel: () => void
}

/** Turn an API error (string, list, or Laravel field map) into one line. */
export const apiErrorText = (error: unknown, fallback: string): string => {
  if (!error) return fallback
  if (typeof error === "string") return error
  if (Array.isArray(error)) return error.filter(Boolean).map(String).join(", ") || fallback
  if (typeof error === "object") {
    const parts = Object.values(error as Record<string, unknown>).flat().filter(Boolean).map(String)
    return parts.join(", ") || fallback
  }
  return fallback
}

/**
 * Small inline form for adding a catalogue entry (medication type, vaccine)
 * without leaving the record form it sits in.
 */
const InlineAddCatalogItem = ({ noun, fields, initialName = "", onSave, onCancel }: Props) => {
  const [values, setValues] = useState<Record<string, string>>(() => ({ name: initialName }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const missing = fields.find((f) => f.required && !(values[f.key] ?? "").trim())
    if (missing) {
      setError(`${missing.label} is required`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const message = await onSave(
        Object.fromEntries(Object.entries(values).map(([k, v]) => [k, (v ?? "").trim()])),
      )
      if (message) setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="mt-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3"
      onKeyDown={(e) => {
        // Enter here must save this item, not submit the whole record form.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault()
          void save()
        }
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-800">Add a new {noun}</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {fields.map((f, i) => (
          <div key={f.key} className={i === 0 ? "sm:col-span-1" : undefined}>
            <label className="mb-1 block text-[11px] font-medium text-slate-600" htmlFor={`new-${f.key}`}>
              {f.label}
              {f.required ? <span className="ml-0.5 text-rose-500">*</span> : null}
            </label>
            <Input
              id={`new-${f.key}`}
              type={f.type ?? "text"}
              min={f.type === "number" ? 1 : undefined}
              autoFocus={i === 0}
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                setError(null)
              }}
              className={formInputClass(false, "h-9 bg-white")}
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-1 h-3.5 w-3.5" />
          {saving ? "Saving..." : `Add ${noun}`}
        </Button>
      </div>
    </div>
  )
}

export default InlineAddCatalogItem
