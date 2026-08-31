import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"

interface FieldInputProps {
  id: string
  label: string
  icon: React.ReactNode
  type?: string
  min?: number
  max?: number
  step?: number
  value: number
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
}

export function DailyRecordFieldInput({
  id,
  label,
  icon,
  type = "number",
  min,
  max,
  step,
  value,
  onChange,
  error,
  placeholder,
  disabled,
}: FieldInputProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-gray-600 flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 text-sm",
          error && "border-red-400 focus-visible:ring-red-300"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
