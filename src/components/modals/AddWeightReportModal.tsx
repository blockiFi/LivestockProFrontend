import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { format } from "date-fns"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bird,
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  FileUp,
  Grid3x3,
  Loader2,
  Plus,
  Scale,
  Sigma,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  X,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
  formTextareaClass,
} from "../ui/form-modal"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Calendar } from "../ui/calendar"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { AiUpgradeNotice } from "@/components/general/AiGate"
import { useSubscription } from "@/hooks/useSubscription"
import { cn } from "@/lib/utils"
import { flockAgeDaysOnDate } from "@/lib/feed-age"
import { extractWeightSamples, getLastWeightTarget } from "@/lib/request"
import type {
  DetailedFlockRecord,
  FlockRecord,
  WeighingMethod,
  WeightExtractionResult,
  WeightLastTarget,
  WeightReportPayload,
  WeightSex,
} from "@/lib/types"
import type { RootState } from "@/store"
import {
  DEFAULT_UNIFORMITY_BAND,
  UNIFORMITY_BANDS,
  UNIFORMITY_GRADE_STYLES,
  WEIGHING_METHOD_LABELS,
  UNIFORMITY_METHOD_LABELS,
  computeWeightStats,
  cvGrade,
  estimateUniformityFromSummary,
  formatGrams,
  outlierFlags,
  parseWeightText,
  uniformityGrade,
  weightHistogram,
} from "@/lib/weightStats"

export type WeightHouseOption = { id: number; name: string }

interface AddWeightReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: WeightReportPayload) => Promise<void>
  flock?: FlockRecord | DetailedFlockRecord
  houses?: WeightHouseOption[]
}

type EntryMode = "manual" | "paste" | "ai" | "summary"
type EntryUnit = "g" | "kg"
type SampleEntry = { key: number; value: string; sex: "male" | "female" | null; excluded: boolean }

const STEPS = [
  { title: "Session", icon: CalendarIcon },
  { title: "Samples", icon: Scale },
  { title: "Target & results", icon: Target },
  { title: "Review", icon: StickyNote },
] as const

const AI_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.csv,.txt,.xlsx"
const NO_HOUSE = "none"

let entryKey = 0
const newEntry = (value = "", sex: SampleEntry["sex"] = null): SampleEntry => ({
  key: ++entryKey,
  value,
  sex,
  excluded: false,
})
const blankEntries = (n = 20) => Array.from({ length: n }, () => newEntry())

const todayIso = () => format(new Date(), "yyyy-MM-dd")

const toGrams = (value: string, unit: EntryUnit): number | null => {
  const trimmed = value.trim().replace(",", ".")
  if (trimmed === "") return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return NaN
  return unit === "kg" ? Math.round(n * 10000) / 10 : n
}

const currentBirdCount = (flock?: FlockRecord | DetailedFlockRecord) => {
  if (!flock) return 0
  if (flock.actual_quantity != null) return flock.actual_quantity
  const mortality = (flock as DetailedFlockRecord).mortality_reports
  if (mortality) return flock.quantity - mortality.reduce((sum, r) => sum + r.mortality_count, 0)
  return flock.quantity
}

const AddWeightReportModal = ({ isOpen, onClose, onSubmit, flock, houses = [] }: AddWeightReportModalProps) => {
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const { aiEnabled } = useSubscription()

  const defaultHouseId = flock?.house_id && houses.some((h) => h.id === flock.house_id) ? String(flock.house_id) : NO_HOUSE

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Session
  const [reportDate, setReportDate] = useState(todayIso())
  const [showCalendar, setShowCalendar] = useState(false)
  const [weighedAt, setWeighedAt] = useState(format(new Date(), "HH:mm"))
  const [houseId, setHouseId] = useState<string>(defaultHouseId)
  const [penLabel, setPenLabel] = useState("")
  const [sex, setSex] = useState<WeightSex>("mixed")
  const [method, setMethod] = useState<WeighingMethod>("manual_scale")
  const [scaleRef, setScaleRef] = useState("")
  const [numberOfBirds, setNumberOfBirds] = useState<string>(String(currentBirdCount(flock)))

  // Samples
  const [mode, setMode] = useState<EntryMode>("manual")
  const [entries, setEntries] = useState<SampleEntry[]>(() => blankEntries())
  const [entryUnit, setEntryUnit] = useState<EntryUnit>("g")
  const [pasteText, setPasteText] = useState("")
  const [pasteUnit, setPasteUnit] = useState<"auto" | EntryUnit>("auto")
  const [dataSource, setDataSource] = useState<"manual" | "ai_image" | "ai_file">("manual")
  const [sourceFilePath, setSourceFilePath] = useState<string | null>(null)
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiResult, setAiResult] = useState<WeightExtractionResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [summary, setSummary] = useState({ average: "", min: "", max: "", sampleSize: "", withinBand: "" })

  // Target
  const [target, setTarget] = useState("")
  const [targetTouched, setTargetTouched] = useState(false)
  const [lastTarget, setLastTarget] = useState<WeightLastTarget | null>(null)
  const [band, setBand] = useState<number>(DEFAULT_UNIFORMITY_BAND)
  const [notes, setNotes] = useState("")

  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const pendingFocus = useRef<number | null>(null)

  const ageDays = flock?.arrival_date
    ? flockAgeDaysOnDate(flock.arrival_date, flock.arrival_age_days ?? 0, reportDate)
    : null

  useEffect(() => {
    if (!isOpen || !token || !farmId || !flock?.id) return
    let cancelled = false
    getLastWeightTarget(token, farmId, flock.id, sex).then((res) => {
      if (cancelled || !res.success || !res.data) return
      setLastTarget(res.data)
      if (!targetTouched && res.data.target_weight_g) {
        setTarget(String(res.data.target_weight_g))
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token, farmId, flock?.id, sex])

  useEffect(() => {
    if (pendingFocus.current === null) return
    const el = inputRefs.current.get(pendingFocus.current)
    if (el) {
      el.focus()
      pendingFocus.current = null
    }
  }, [entries])

  const entryGrams = useMemo(() => entries.map((e) => toGrams(e.value, entryUnit)), [entries, entryUnit])
  const filledIdx = useMemo(
    () => entryGrams.map((g, i) => (g !== null && Number.isFinite(g) ? i : -1)).filter((i) => i >= 0),
    [entryGrams]
  )
  const invalidCount = entryGrams.filter((g) => g !== null && !Number.isFinite(g)).length
  const outliersByIdx = useMemo(() => {
    const flags = outlierFlags(filledIdx.map((i) => entryGrams[i] as number))
    const map = new Map<number, boolean>()
    filledIdx.forEach((idx, j) => map.set(idx, flags[j]))
    return map
  }, [filledIdx, entryGrams])
  const includedWeights = filledIdx.filter((i) => !entries[i].excluded).map((i) => entryGrams[i] as number)
  const outlierCount = filledIdx.filter((i) => outliersByIdx.get(i) && !entries[i].excluded).length
  const excludedCount = filledIdx.filter((i) => entries[i].excluded).length

  const targetG = Number(target) > 0 ? Number(target) : null
  const stats = useMemo(() => computeWeightStats(includedWeights, targetG, band), [includedWeights, targetG, band])
  const histogram = useMemo(
    () => weightHistogram(includedWeights, stats.bandLow, stats.bandHigh),
    [includedWeights, stats.bandLow, stats.bandHigh]
  )

  const summaryAvgG = Number(summary.average) > 0 ? Number(summary.average) : null
  const isSummary = mode === "summary"
  const summaryUniformity = useMemo(
    () =>
      estimateUniformityFromSummary(
        summaryAvgG,
        Number(summary.min) > 0 ? Number(summary.min) : null,
        Number(summary.max) > 0 ? Number(summary.max) : null,
        Number(summary.sampleSize) > 0 ? Number(summary.sampleSize) : null,
        band,
        summary.withinBand !== "" && Number.isInteger(Number(summary.withinBand)) ? Number(summary.withinBand) : null
      ),
    [summaryAvgG, summary.min, summary.max, summary.sampleSize, summary.withinBand, band]
  )

  const clearError = (key: string) => {
    if (!errors[key]) return
    setErrors((prev) => {
      const rest = { ...prev }
      delete rest[key]
      return rest
    })
  }

  // ---------- Sample grid ----------
  const updateEntry = (idx: number, patch: Partial<SampleEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
    clearError("samples")
  }

  const focusNext = (idx: number) => {
    if (idx + 1 < entries.length) {
      inputRefs.current.get(entries[idx + 1].key)?.focus()
      return
    }
    const added = newEntry()
    pendingFocus.current = added.key
    setEntries((prev) => [...prev, added])
  }

  const addCells = (n: number) => setEntries((prev) => [...prev, ...blankEntries(n)])

  const clearSamples = () => {
    setEntries(blankEntries())
    setDataSource("manual")
    setSourceFilePath(null)
    setAiResult(null)
  }

  const removeEmptyAndCompact = () => {
    setEntries((prev) => {
      const kept = prev.filter((e) => e.value.trim() !== "")
      return kept.length > 0 ? kept : blankEntries()
    })
  }

  const loadGrams = (grams: Array<{ weight_g: number; sex?: "male" | "female" | null }>, append: boolean) => {
    const asEntries = grams.map((s) =>
      newEntry(entryUnit === "kg" && append ? String(s.weight_g / 1000) : String(s.weight_g), s.sex ?? null)
    )
    if (append) {
      setEntries((prev) => [...prev.filter((e) => e.value.trim() !== ""), ...asEntries])
    } else {
      setEntryUnit("g")
      setEntries(asEntries)
    }
    clearError("samples")
  }

  const applyPaste = (append: boolean) => {
    const grams = parseWeightText(pasteText, pasteUnit)
    if (grams.length === 0) {
      setErrors((prev) => ({ ...prev, paste: "No numbers found in the pasted text." }))
      return
    }
    loadGrams(grams.map((g) => ({ weight_g: g })), append)
    if (!append) {
      setDataSource("manual")
      setSourceFilePath(null)
    }
    setPasteText("")
    clearError("paste")
    setMode("manual")
  }

  // ---------- AI ----------
  const runExtraction = async () => {
    if (!aiFile || !token || !farmId) return
    setAiBusy(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await extractWeightSamples(token, farmId, aiFile, flock?.id)
      if (!res.success || !res.data) {
        const err = Array.isArray(res.error) ? res.error.join(", ") : String(res.error ?? "Extraction failed")
        setAiError(err)
        return
      }
      setAiResult(res.data)
      if (res.data.samples.length === 0) {
        setAiError(res.data.warnings[0] ?? "No bird weights were found in this file.")
      }
    } finally {
      setAiBusy(false)
    }
  }

  const applyAiResult = () => {
    if (!aiResult) return
    loadGrams(aiResult.samples, false)
    setDataSource(aiResult.data_source)
    setSourceFilePath(aiResult.source_file_path)
    if (aiResult.target_weight_g && !targetTouched) {
      setTarget(String(aiResult.target_weight_g))
      setTargetTouched(true)
    }
    if (aiResult.house && !penLabel) setPenLabel(aiResult.house)
    setMode("manual")
  }

  // ---------- Validation & navigation ----------
  const validateStep = (s: number): boolean => {
    const next: Record<string, string> = {}
    if (s === 0) {
      if (!reportDate) next.report_date = "Date is required"
      if (numberOfBirds !== "" && (!Number.isFinite(Number(numberOfBirds)) || Number(numberOfBirds) < 0)) {
        next.number_of_birds = "Enter a valid bird count"
      }
    }
    if (s === 1) {
      if (isSummary) {
        const avg = Number(summary.average)
        const min = Number(summary.min)
        const max = Number(summary.max)
        if (!(avg > 0)) next.summary_average = "Average weight is required"
        if (!(min > 0)) next.summary_min = "Min weight is required"
        if (!(max > 0)) next.summary_max = "Max weight is required"
        if (min > 0 && max > 0 && min > max) next.summary_max = "Max must be ≥ min"
        if (avg > 0 && min > 0 && max > 0 && (avg < min || avg > max)) next.summary_average = "Average must be between min and max"
        if (!(Number(summary.sampleSize) > 0)) next.summary_sample = "Sample size is required"
        if (summary.withinBand !== "") {
          const within = Number(summary.withinBand)
          if (!Number.isInteger(within) || within < 0) next.summary_within = "Enter a whole number of birds"
          else if (Number(summary.sampleSize) > 0 && within > Number(summary.sampleSize)) next.summary_within = "Cannot exceed birds weighed"
        }
      } else {
        if (invalidCount > 0) next.samples = `${invalidCount} cell(s) contain invalid values.`
        else if (includedWeights.length === 0) next.samples = "Enter at least one bird weight."
        else if (includedWeights.some((w) => w > 20000)) next.samples = "Weights above 20,000 g are not allowed — check the unit."
      }
    }
    if (s === 2 && !isSummary && !targetG) {
      next.target = "Target weight is required to compute deviation."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    if (step === 1 && !isSummary) removeEmptyAndCompact()
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const resetAll = () => {
    setStep(0)
    setErrors({})
    setReportDate(todayIso())
    setShowCalendar(false)
    setWeighedAt(format(new Date(), "HH:mm"))
    setHouseId(defaultHouseId)
    setPenLabel("")
    setSex("mixed")
    setMethod("manual_scale")
    setScaleRef("")
    setNumberOfBirds(String(currentBirdCount(flock)))
    setMode("manual")
    setEntries(blankEntries())
    setEntryUnit("g")
    setPasteText("")
    setPasteUnit("auto")
    setDataSource("manual")
    setSourceFilePath(null)
    setAiFile(null)
    setAiResult(null)
    setAiError(null)
    setSummary({ average: "", min: "", max: "", sampleSize: "", withinBand: "" })
    setTarget("")
    setTargetTouched(false)
    setLastTarget(null)
    setBand(DEFAULT_UNIFORMITY_BAND)
    setNotes("")
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetAll()
    onClose()
  }

  const handleSubmit = async () => {
    for (let s = 0; s < STEPS.length - 1; s++) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }
    if (!flock) return

    const session: WeightReportPayload = {
      flock_id: flock.id,
      report_date: reportDate,
      house_id: houseId !== NO_HOUSE ? Number(houseId) : null,
      pen_label: penLabel.trim() || null,
      sex,
      weighing_method: method,
      scale_reference: scaleRef.trim() || null,
      weighed_at_time: weighedAt || null,
      number_of_birds: numberOfBirds !== "" ? Number(numberOfBirds) : null,
      uniformity_band_percent: band,
      target_weight_g: targetG,
      notes: notes.trim() || null,
    }

    const payload: WeightReportPayload = isSummary
      ? {
          ...session,
          average_weight: Math.round(Number(summary.average)) / 1000,
          min_weight: Math.round(Number(summary.min)) / 1000,
          max_weight: Math.round(Number(summary.max)) / 1000,
          sample_size: Number(summary.sampleSize),
          birds_within_band: summary.withinBand !== "" ? Number(summary.withinBand) : null,
        }
      : {
          ...session,
          data_source: dataSource,
          source_file_path: sourceFilePath,
          samples: filledIdx.map((i) => ({
            weight_g: entryGrams[i] as number,
            sex: entries[i].sex,
            excluded: entries[i].excluded,
          })),
        }

    setIsSubmitting(true)
    try {
      await onSubmit(payload)
      resetAll()
      onClose()
    } catch (error) {
      console.error("Error creating weight report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------- Render helpers ----------
  const shownUniformity = isSummary ? summaryUniformity.uniformityPercent : stats.uniformityPercent
  const shownCv = isSummary ? summaryUniformity.cvPercent : stats.cvPercent
  const uGrade = uniformityGrade(shownUniformity)
  const cGrade = cvGrade(shownCv)
  const deviationG = isSummary ? (summaryAvgG && targetG ? summaryAvgG - targetG : null) : stats.deviationG
  const deviationPct = isSummary
    ? summaryAvgG && targetG ? ((summaryAvgG - targetG) / targetG) * 100 : null
    : stats.deviationPercent

  const StatTile = ({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) => (
    <div className={cn("rounded-xl border border-slate-200 bg-white px-3 py-2.5", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
      {sub ? <p className="text-[11px] text-slate-500">{sub}</p> : null}
    </div>
  )

  const stepper = (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const done = i < step
        const active = i === step
        return (
          <li key={s.title} className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : undefined)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition",
                active && "border-sky-300 bg-sky-50 text-sky-800",
                done && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                !active && !done && "border-slate-200 bg-white text-slate-400"
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Icon className="h-4 w-4 shrink-0" />}
              <span className="hidden truncate sm:inline">{s.title}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )

  const sessionStep = (
    <FormSection step={1} icon={CalendarIcon} title="Weighing session" description="When, where and how the birds were weighed.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Date weighed" required error={errors.report_date} hint={ageDays !== null ? `Bird age on this date: ${ageDays} days` : undefined}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              formInputClass(!!errors.report_date),
              "flex w-full items-center justify-between border px-3 text-sm hover:bg-white",
              showCalendar && "border-sky-500 ring-2 ring-sky-100"
            )}
          >
            <span className="font-medium text-slate-900">
              {reportDate ? format(new Date(reportDate + "T12:00:00"), "EEE, MMM d, yyyy") : "Select date"}
            </span>
            {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showCalendar && (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <Calendar
                mode="single"
                selected={reportDate ? new Date(reportDate + "T12:00:00") : undefined}
                disabled={(d) => d > new Date()}
                onSelect={(d) => {
                  if (!d) return
                  setReportDate(format(d, "yyyy-MM-dd"))
                  setShowCalendar(false)
                  clearError("report_date")
                }}
              />
            </div>
          )}
        </FormField>
        <FormField label="Time weighed" htmlFor="weighed_at" hint="Weigh at the same time each session (ideally before feeding).">
          <Input id="weighed_at" type="time" value={weighedAt} onChange={(e) => setWeighedAt(e.target.value)} className={formInputClass()} />
        </FormField>
        <FormField label="House">
          <Select value={houseId} onValueChange={setHouseId}>
            <SelectTrigger className={formInputClass(false, "w-full")}>
              <SelectValue placeholder="Select house" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_HOUSE}>Not specified</SelectItem>
              {houses.map((h) => (
                <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Pen / section" htmlFor="pen_label" hint="e.g. Pen 3, Front third, Brooder A">
          <Input id="pen_label" value={penLabel} maxLength={100} onChange={(e) => setPenLabel(e.target.value)} placeholder="Optional" className={formInputClass()} />
        </FormField>
        <FormField label="Sex of sample">
          <Select value={sex} onValueChange={(v) => setSex(v as WeightSex)}>
            <SelectTrigger className={formInputClass(false, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixed (as hatched)</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Weighing method">
          <Select value={method} onValueChange={(v) => setMethod(v as WeighingMethod)}>
            <SelectTrigger className={formInputClass(false, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WEIGHING_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Scale reference" htmlFor="scale_ref" hint="Scale ID or last calibration note">
          <Input id="scale_ref" value={scaleRef} maxLength={100} onChange={(e) => setScaleRef(e.target.value)} placeholder="Optional" className={formInputClass()} />
        </FormField>
        <FormField
          label="Birds in house/flock"
          htmlFor="number_of_birds"
          error={errors.number_of_birds}
          hint={`Current flock count: ${currentBirdCount(flock).toLocaleString()}`}
        >
          <div className="relative">
            <Bird className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="number_of_birds"
              type="number"
              min="0"
              value={numberOfBirds}
              onChange={(e) => {
                setNumberOfBirds(e.target.value)
                clearError("number_of_birds")
              }}
              className={formInputClass(!!errors.number_of_birds, "pl-9")}
            />
          </div>
        </FormField>
      </div>
    </FormSection>
  )

  const sampleGrid = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          {(["g", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setEntryUnit(u)}
              className={cn("rounded-md px-2.5 py-1 font-medium", entryUnit === u ? "bg-sky-600 text-white" : "text-slate-600")}
            >
              {u}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => addCells(10)} className="h-8 rounded-lg">
          <Plus className="mr-1 h-3.5 w-3.5" /> 10 cells
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearSamples} className="h-8 rounded-lg text-rose-600 hover:text-rose-700">
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {filledIdx.length} entered
          {excludedCount > 0 ? ` · ${excludedCount} excluded` : ""}
          {outlierCount > 0 ? ` · ${outlierCount} possible outlier${outlierCount > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">
        Type a weight and press Enter to move to the next bird. Amber cells look like typing errors; click the × to exclude a bird from the statistics.
      </p>
      <div className="grid max-h-[340px] grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-6">
        {entries.map((entry, idx) => {
          const g = entryGrams[idx]
          const invalid = g !== null && !Number.isFinite(g)
          const outlier = outliersByIdx.get(idx) ?? false
          return (
            <div
              key={entry.key}
              className={cn(
                "group relative flex items-center rounded-lg border bg-white pl-1.5",
                invalid && "border-rose-300 bg-rose-50",
                !invalid && outlier && !entry.excluded && "border-amber-300 bg-amber-50",
                entry.excluded && "border-slate-200 bg-slate-100 opacity-60",
                !invalid && !outlier && !entry.excluded && "border-slate-200"
              )}
            >
              <span className="w-6 shrink-0 text-[10px] tabular-nums text-slate-400">{idx + 1}</span>
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(entry.key, el)
                  else inputRefs.current.delete(entry.key)
                }}
                inputMode="decimal"
                value={entry.value}
                onChange={(e) => updateEntry(idx, { value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    focusNext(idx)
                  }
                }}
                placeholder={entryUnit}
                className={cn(
                  "h-8 w-full min-w-0 bg-transparent text-sm tabular-nums outline-none",
                  entry.excluded && "line-through"
                )}
              />
              {entry.sex ? <span className="mr-0.5 text-[10px] font-semibold text-slate-400">{entry.sex === "male" ? "M" : "F"}</span> : null}
              {entry.value.trim() !== "" && (
                <button
                  type="button"
                  title={entry.excluded ? "Include bird" : "Exclude bird"}
                  onClick={() => updateEntry(idx, { excluded: !entry.excluded })}
                  className={cn(
                    "mr-1 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700",
                    !entry.excluded && "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    outlier && !entry.excluded && "opacity-100 text-amber-600"
                  )}
                >
                  {entry.excluded ? <Plus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {includedWeights.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 py-1.5"><span className="text-slate-500">Avg </span><span className="font-semibold">{formatGrams(stats.mean)}</span></div>
          <div className="rounded-lg bg-slate-50 py-1.5"><span className="text-slate-500">Min </span><span className="font-semibold">{formatGrams(stats.min)}</span></div>
          <div className="rounded-lg bg-slate-50 py-1.5"><span className="text-slate-500">Max </span><span className="font-semibold">{formatGrams(stats.max)}</span></div>
        </div>
      )}
    </div>
  )

  const pastePanel = (
    <div className="space-y-3">
      <FormField label="Paste weights" error={errors.paste} hint="One per line, or separated by commas, spaces or tabs — e.g. copied from a spreadsheet column.">
        <Textarea
          value={pasteText}
          onChange={(e) => {
            setPasteText(e.target.value)
            clearError("paste")
          }}
          rows={7}
          placeholder={"1850\n1920\n1785\n..."}
          className={formTextareaClass(!!errors.paste, "font-mono text-sm")}
        />
      </FormField>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Unit:</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          {(["auto", "g", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setPasteUnit(u)}
              className={cn("rounded-md px-2.5 py-1 font-medium", pasteUnit === u ? "bg-sky-600 text-white" : "text-slate-600")}
            >
              {u === "auto" ? "Auto-detect" : u}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{parseWeightText(pasteText, pasteUnit).length} values detected</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => applyPaste(true)} disabled={!pasteText.trim()}>
            Append
          </Button>
          <Button type="button" size="sm" className="rounded-lg" onClick={() => applyPaste(false)} disabled={!pasteText.trim()}>
            Replace samples
          </Button>
        </div>
      </div>
    </div>
  )

  const aiPanel = aiEnabled ? (
    <div className="space-y-3">
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-sky-400 hover:bg-sky-50/40",
          aiFile && "border-sky-400 bg-sky-50/40"
        )}
      >
        <FileUp className="h-6 w-6 text-sky-600" />
        <span className="text-sm font-medium text-slate-700">{aiFile ? aiFile.name : "Upload a weighing sheet"}</span>
        <span className="text-xs text-slate-500">Photo of a handwritten sheet, scale printout, PDF, CSV or Excel — up to 10 MB</span>
        <input
          type="file"
          accept={AI_ACCEPT}
          className="hidden"
          onChange={(e) => {
            setAiFile(e.target.files?.[0] ?? null)
            setAiResult(null)
            setAiError(null)
          }}
        />
      </label>
      <div className="flex justify-end">
        <Button type="button" onClick={runExtraction} disabled={!aiFile || aiBusy} className="rounded-lg">
          {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {aiBusy ? "Reading weights…" : "Extract weights"}
        </Button>
      </div>
      {aiError && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {aiError}
        </div>
      )}
      {aiResult && aiResult.samples.length > 0 && (() => {
        const preview = computeWeightStats(aiResult.samples.map((s) => s.weight_g))
        const flagged = aiResult.samples.filter((s) => s.is_outlier).length
        return (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-emerald-800">{aiResult.samples.length} bird weights found</span>
              {aiResult.confidence !== null && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-600">
                  Confidence {Math.round((aiResult.confidence <= 1 ? aiResult.confidence * 100 : aiResult.confidence))}%
                </span>
              )}
              {aiResult.unit && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-600">Source unit: {aiResult.unit}</span>}
            </div>
            <p className="text-xs text-slate-600">
              Avg {formatGrams(preview.mean)} · range {formatGrams(preview.min)}–{formatGrams(preview.max)}
              {flagged > 0 ? ` · ${flagged} value(s) look suspicious` : ""}
              {aiResult.target_weight_g ? ` · target on sheet ${formatGrams(aiResult.target_weight_g)}` : ""}
              {aiResult.date ? ` · sheet date ${aiResult.date}` : ""}
            </p>
            {aiResult.warnings.length > 0 && (
              <ul className="list-disc pl-5 text-[11px] text-amber-700">
                {aiResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            <div className="flex justify-end">
              <Button type="button" size="sm" className="rounded-lg" onClick={applyAiResult}>
                Review & use these weights
              </Button>
            </div>
          </div>
        )
      })()}
    </div>
  ) : (
    <AiUpgradeNotice />
  )

  const summaryPanel = (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Use this when individual bird weights were not kept. Uniformity is estimated from the min–max range, or enter the
        number of birds you counted within ±{band}% of the average for an exact figure.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <FormField label="Average (g)" required error={errors.summary_average}>
          <Input type="number" min="1" value={summary.average} onChange={(e) => { setSummary((p) => ({ ...p, average: e.target.value })); clearError("summary_average") }} className={formInputClass(!!errors.summary_average)} />
        </FormField>
        <FormField label="Min (g)" required error={errors.summary_min}>
          <Input type="number" min="1" value={summary.min} onChange={(e) => { setSummary((p) => ({ ...p, min: e.target.value })); clearError("summary_min") }} className={formInputClass(!!errors.summary_min)} />
        </FormField>
        <FormField label="Max (g)" required error={errors.summary_max}>
          <Input type="number" min="1" value={summary.max} onChange={(e) => { setSummary((p) => ({ ...p, max: e.target.value })); clearError("summary_max") }} className={formInputClass(!!errors.summary_max)} />
        </FormField>
        <FormField label="Birds weighed" required error={errors.summary_sample}>
          <Input type="number" min="1" value={summary.sampleSize} onChange={(e) => { setSummary((p) => ({ ...p, sampleSize: e.target.value })); clearError("summary_sample") }} className={formInputClass(!!errors.summary_sample)} />
        </FormField>
        <FormField label={`Within ±${band}% (optional)`} error={errors.summary_within} hint="Birds counted in band">
          <Input type="number" min="0" step="1" value={summary.withinBand} onChange={(e) => { setSummary((p) => ({ ...p, withinBand: e.target.value })); clearError("summary_within") }} placeholder="e.g. 42" className={formInputClass(!!errors.summary_within)} />
        </FormField>
      </div>
      {summaryUniformity.uniformityPercent !== null && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <span className="text-slate-500">Uniformity</span>
          <span className={cn("font-semibold", uGrade ? UNIFORMITY_GRADE_STYLES[uGrade].text : "text-slate-900")}>
            {summaryUniformity.uniformityPercent.toFixed(1)}%
          </span>
          <span className="text-slate-400">· {UNIFORMITY_METHOD_LABELS[summaryUniformity.method ?? "estimated"]}</span>
          {summaryUniformity.cvPercent !== null && <span className="text-slate-400">· CV ≈ {summaryUniformity.cvPercent.toFixed(1)}%</span>}
        </div>
      )}
    </div>
  )

  const samplesStep = (
    <FormSection
      step={2}
      icon={Scale}
      title="Sample weights"
      description="Weigh a representative sample (at least 1% of the flock or 50–100 birds) from different areas of the house."
      action={
        dataSource !== "manual" && !isSummary ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            <Sparkles className="h-3 w-3" /> AI-extracted
          </span>
        ) : undefined
      }
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as EntryMode)}>
        <TabsList className="mb-2 w-full">
          <TabsTrigger value="manual"><Grid3x3 /> Manual</TabsTrigger>
          <TabsTrigger value="paste"><ClipboardPaste /> Paste</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles /> AI extract</TabsTrigger>
          <TabsTrigger value="summary"><Sigma /> Summary only</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">{sampleGrid}</TabsContent>
        <TabsContent value="paste">{pastePanel}</TabsContent>
        <TabsContent value="ai">{aiPanel}</TabsContent>
        <TabsContent value="summary">{summaryPanel}</TabsContent>
      </Tabs>
      {errors.samples && <p className="mt-2 text-xs text-rose-600">{errors.samples}</p>}
    </FormSection>
  )

  const deviationTone = deviationPct === null ? "text-slate-900" : Math.abs(deviationPct) <= 3 ? "text-emerald-600" : Math.abs(deviationPct) <= 7 ? "text-amber-600" : "text-red-600"

  const targetStep = (
    <div className="space-y-4">
      <FormSection step={3} icon={Target} title="Target weight" description="The breed-standard or company target for this age and sex.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Target weight (g)"
            required={!isSummary}
            htmlFor="target"
            error={errors.target}
            hint={
              lastTarget?.target_weight_g
                ? `Previous session target: ${formatGrams(lastTarget.target_weight_g)}${lastTarget.age_days != null ? ` at day ${lastTarget.age_days}` : ""}${lastTarget.report_date ? ` (${lastTarget.report_date})` : ""}`
                : "No previous target recorded for this flock."
            }
          >
            <div className="relative">
              <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="target"
                type="number"
                min="1"
                step="1"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value)
                  setTargetTouched(true)
                  clearError("target")
                }}
                placeholder="e.g. 2100"
                className={formInputClass(!!errors.target, "pl-9")}
              />
            </div>
          </FormField>
          <FormField label="Uniformity band" hint="Birds within ± this % of the average count as uniform. 10% is the industry standard.">
            <Select value={String(band)} onValueChange={(v) => setBand(Number(v))}>
              <SelectTrigger className={formInputClass(false, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIFORMITY_BANDS.map((b) => (
                  <SelectItem key={b} value={String(b)}>± {b}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={Sigma} title="Results" description={isSummary ? "Calculated from the summary you entered." : `Calculated from ${stats.count} birds.`}>
        {isSummary ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile label="Average" value={formatGrams(summaryAvgG)} />
            <StatTile label="Target" value={formatGrams(targetG)} />
            <StatTile
              label="vs target"
              value={<span className={deviationTone}>{deviationG !== null ? `${deviationG > 0 ? "+" : ""}${Math.round(deviationG)} g` : "—"}</span>}
              sub={deviationPct !== null ? `${deviationPct > 0 ? "+" : ""}${deviationPct.toFixed(1)}%` : undefined}
            />
            <StatTile label="Birds weighed" value={summary.sampleSize || "—"} />
            <StatTile
              label="Uniformity"
              value={
                <span className={uGrade ? UNIFORMITY_GRADE_STYLES[uGrade].text : undefined}>
                  {shownUniformity !== null ? `${shownUniformity.toFixed(1)}%` : "—"}
                </span>
              }
              sub={
                summaryUniformity.method
                  ? `${uGrade ? `${UNIFORMITY_GRADE_STYLES[uGrade].label} · ` : ""}${summaryUniformity.method === "counted" ? "counted" : "estimated"} · ±${band}%`
                  : "Enter min, max and birds weighed"
              }
            />
            <StatTile
              label="CV (est.)"
              value={<span className={cGrade ? UNIFORMITY_GRADE_STYLES[cGrade].text : undefined}>{shownCv !== null ? `${shownCv.toFixed(1)}%` : "—"}</span>}
              sub={summaryUniformity.stdDev !== null ? `SD ≈ ${summaryUniformity.stdDev.toFixed(0)} g` : undefined}
            />
            <StatTile label="Min" value={formatGrams(Number(summary.min) || null)} />
            <StatTile label="Max" value={formatGrams(Number(summary.max) || null)} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <StatTile
                label="Uniformity"
                value={
                  <span className={uGrade ? UNIFORMITY_GRADE_STYLES[uGrade].text : undefined}>
                    {stats.uniformityPercent !== null ? `${stats.uniformityPercent.toFixed(1)}%` : "—"}
                  </span>
                }
                sub={uGrade ? `${UNIFORMITY_GRADE_STYLES[uGrade].label} · ${stats.birdsWithinBand}/${stats.count} within ±${band}%` : undefined}
                className={uGrade ? cn("border", UNIFORMITY_GRADE_STYLES[uGrade].badge.split(" ").find((c) => c.startsWith("border-"))) : undefined}
              />
              <StatTile label="Average" value={formatGrams(stats.mean, 1)} sub={`Median ${formatGrams(stats.median)}`} />
              <StatTile
                label="vs target"
                value={<span className={deviationTone}>{deviationG !== null ? `${deviationG > 0 ? "+" : ""}${Math.round(deviationG)} g` : "—"}</span>}
                sub={deviationPct !== null ? `${deviationPct > 0 ? "+" : ""}${deviationPct.toFixed(1)}% of ${formatGrams(targetG)}` : "Enter a target"}
              />
              <StatTile
                label="CV"
                value={<span className={cGrade ? UNIFORMITY_GRADE_STYLES[cGrade].text : undefined}>{stats.cvPercent !== null ? `${stats.cvPercent.toFixed(1)}%` : "—"}</span>}
                sub={`SD ${stats.stdDev !== null ? stats.stdDev.toFixed(1) : "—"} g`}
              />
              <StatTile label="Min" value={formatGrams(stats.min)} />
              <StatTile label="Max" value={formatGrams(stats.max)} />
              <StatTile label="Range" value={stats.min !== null && stats.max !== null ? `${Math.round(stats.max - stats.min)} g` : "—"} />
              <StatTile label="Uniform band" value={stats.bandLow !== null ? `${Math.round(stats.bandLow)}–${Math.round(stats.bandHigh ?? 0)}` : "—"} sub="grams" />
            </div>
            {histogram.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Weight distribution</span>
                  <span className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> within ±{band}%</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300" /> outside</span>
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={histogram} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} birds`, "Count"]} labelFormatter={(l) => `${l} g`} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {histogram.map((bin) => (
                        <Cell key={bin.label} fill={bin.inBand ? "#10b981" : "#cbd5e1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </FormSection>
    </div>
  )

  const houseName = houseId !== NO_HOUSE ? houses.find((h) => String(h.id) === houseId)?.name : null

  const reviewStep = (
    <div className="space-y-4">
      <FormSection step={4} icon={StickyNote} title="Observations" description="Health, feeding, lighting or anything that explains the result.">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="e.g. Birds in the back third lighter; drinker line height adjusted." className={formTextareaClass()} />
      </FormSection>
      <FormSection icon={CheckCircle2} title="Summary">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
          {[
            ["Date", `${reportDate}${weighedAt ? ` ${weighedAt}` : ""}`],
            ["Age", ageDays !== null ? `${ageDays} days` : "—"],
            ["Location", [houseName, penLabel].filter(Boolean).join(" · ") || "—"],
            ["Sex", sex.charAt(0).toUpperCase() + sex.slice(1)],
            ["Method", WEIGHING_METHOD_LABELS[method]],
            ["Source", isSummary ? "Summary only" : dataSource === "manual" ? "Manual entry" : "AI extraction"],
            ["Birds weighed", isSummary ? summary.sampleSize : String(stats.count)],
            ["Average", formatGrams(isSummary ? summaryAvgG : stats.mean, isSummary ? 0 : 1)],
            ["Target", formatGrams(targetG)],
            [
              "Uniformity",
              shownUniformity !== null
                ? `${shownUniformity.toFixed(1)}% (±${band}%)${isSummary ? ` · ${summaryUniformity.method === "counted" ? "counted" : "estimated"}` : ""}`
                : "—",
            ],
            ["CV", shownCv !== null ? `${shownCv.toFixed(1)}%${isSummary ? " (est.)" : ""}` : "—"],
            ["vs target", deviationPct !== null ? `${deviationPct > 0 ? "+" : ""}${deviationPct.toFixed(1)}%` : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        {!isSummary && excludedCount > 0 && (
          <p className="mt-3 text-xs text-slate-500">{excludedCount} excluded bird(s) are saved with the session but not used in the statistics.</p>
        )}
      </FormSection>
    </div>
  )

  const isLast = step === STEPS.length - 1

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      title="Record Weighing Session"
      description={flock ? `${flock.name}${ageDays !== null ? ` · day ${ageDays}` : ""}` : "Record individual bird weights for this flock."}
      icon={Scale}
      tone="flock"
      size="xl"
      busy={isSubmitting}
      dismissible={false}
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          submitType="button"
          onConfirm={isLast ? handleSubmit : goNext}
          submitLabel={isLast ? "Save session" : "Next"}
          busyLabel="Saving..."
          busy={isSubmitting}
          disabled={aiBusy}
          icon={isLast ? CheckCircle2 : ArrowRight}
          leading={
            step > 0 ? (
              <Button type="button" variant="ghost" onClick={goBack} disabled={isSubmitting} className="rounded-xl">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : undefined
          }
        />
      }
    >
      {stepper}
      {step === 0 && sessionStep}
      {step === 1 && samplesStep}
      {step === 2 && targetStep}
      {step === 3 && reviewStep}
    </FormModal>
  )
}

export default AddWeightReportModal
