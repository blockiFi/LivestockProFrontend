import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Droplets, Leaf, Shield } from "lucide-react"
import {
  DILUENT_UNITS,
  MEDICINE_UNITS,
  type DiluentType,
  type DosageRatioFields as DosageRatioFieldsType,
} from "@/lib/medicationDosage"

type Props = {
  title: string
  description?: string
  value: DosageRatioFieldsType
  onChange: (next: DosageRatioFieldsType) => void
  idPrefix: string
  tone?: "preventive" | "treatment"
}

const toneStyles = {
  preventive: {
    shell: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    icon: Shield,
  },
  treatment: {
    shell: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white",
    badge: "bg-amber-100 text-amber-900",
    icon: Leaf,
  },
} as const

export function DosageRatioFields({
  title,
  description,
  value,
  onChange,
  idPrefix,
  tone = "preventive",
}: Props) {
  const set = <K extends keyof DosageRatioFieldsType>(key: K, v: DosageRatioFieldsType[K]) =>
    onChange({ ...value, [key]: v })

  const styles = toneStyles[tone]
  const Icon = styles.icon

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", styles.shell)}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className={cn("mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg", styles.badge)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="col-span-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-med-amt`} className="text-xs text-slate-600">
            Medicine
          </Label>
          <Input
            id={`${idPrefix}-med-amt`}
            type="number"
            step="0.0001"
            min="0"
            value={value.medicine_amount ?? ""}
            onChange={(e) =>
              set("medicine_amount", e.target.value === "" ? null : Number.parseFloat(e.target.value))
            }
            placeholder="1"
            className="h-9 bg-white/80"
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label className="text-xs text-slate-600">Unit</Label>
          <Select value={value.medicine_unit || undefined} onValueChange={(v) => set("medicine_unit", v)}>
            <SelectTrigger className="h-9 bg-white/80">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {MEDICINE_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-end justify-center pb-2 sm:col-span-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200/80">
            <Droplets className="h-3 w-3" />
            per
          </span>
        </div>

        <div className="col-span-1 space-y-1.5">
          <Label htmlFor={`${idPrefix}-dil-amt`} className="text-xs text-slate-600">
            Diluent
          </Label>
          <Input
            id={`${idPrefix}-dil-amt`}
            type="number"
            step="0.0001"
            min="0"
            value={value.diluent_amount ?? ""}
            onChange={(e) =>
              set("diluent_amount", e.target.value === "" ? null : Number.parseFloat(e.target.value))
            }
            placeholder="1"
            className="h-9 bg-white/80"
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label className="text-xs text-slate-600">Unit</Label>
          <Select value={value.diluent_unit || undefined} onValueChange={(v) => set("diluent_unit", v)}>
            <SelectTrigger className="h-9 bg-white/80">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {DILUENT_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Mix into</Label>
          <Select
            value={value.diluent_type || undefined}
            onValueChange={(v: DiluentType) =>
              onChange({
                ...value,
                diluent_type: v,
                diluent_label: v === "other" ? value.diluent_label : "",
              })
            }
          >
            <SelectTrigger className="h-9 bg-white/80">
              <SelectValue placeholder="Water, feed, or other" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.diluent_type === "other" ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-dil-label`} className="text-xs text-slate-600">
              Diluent name
            </Label>
            <Input
              id={`${idPrefix}-dil-label`}
              value={value.diluent_label}
              onChange={(e) => set("diluent_label", e.target.value)}
              placeholder="e.g. milk replacer"
              className="h-9 bg-white/80"
            />
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </div>
  )
}
