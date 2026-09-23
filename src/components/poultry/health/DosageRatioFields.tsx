import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DILUENT_UNITS,
  MEDICINE_UNITS,
  type DiluentType,
  type DosageRatioFields as DosageRatioFieldsType,
} from "@/lib/medicationDosage"

type Props = {
  title: string
  value: DosageRatioFieldsType
  onChange: (next: DosageRatioFieldsType) => void
  idPrefix: string
}

export function DosageRatioFields({ title, value, onChange, idPrefix }: Props) {
  const set = <K extends keyof DosageRatioFieldsType>(key: K, v: DosageRatioFieldsType[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-24">
          <Label htmlFor={`${idPrefix}-med-amt`}>Amount</Label>
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
          />
        </div>
        <div className="w-32">
          <Label>Unit</Label>
          <Select value={value.medicine_unit || undefined} onValueChange={(v) => set("medicine_unit", v)}>
            <SelectTrigger>
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
        <span className="pb-2 text-sm text-gray-600">per</span>
        <div className="w-24">
          <Label htmlFor={`${idPrefix}-dil-amt`}>Amount</Label>
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
          />
        </div>
        <div className="w-32">
          <Label>Unit</Label>
          <Select value={value.diluent_unit || undefined} onValueChange={(v) => set("diluent_unit", v)}>
            <SelectTrigger>
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
        <div className="w-36">
          <Label>Of</Label>
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
            <SelectTrigger>
              <SelectValue placeholder="Diluent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.diluent_type === "other" && (
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor={`${idPrefix}-dil-label`}>Diluent name</Label>
            <Input
              id={`${idPrefix}-dil-label`}
              value={value.diluent_label}
              onChange={(e) => set("diluent_label", e.target.value)}
              placeholder="e.g. milk replacer"
            />
          </div>
        )}
      </div>
    </div>
  )
}
