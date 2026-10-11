import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ModalTone =
  | "inventory"
  | "health"
  | "feed"
  | "flock"
  | "sales"
  | "schedule"
  | "settings"
  | "report"
  | "danger"

type ToneClasses = {
  header: string
  description: string
  chip: string
  badge: string
  button: string
  accentText: string
  accentPanel: string
}

// Class strings are written out in full so Tailwind keeps them in the build.
const TONES: Record<ModalTone, ToneClasses> = {
  inventory: {
    header: "bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700",
    description: "text-indigo-50/90",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    badge: "bg-indigo-600",
    button: "bg-indigo-700 hover:bg-indigo-800",
    accentText: "text-indigo-700",
    accentPanel: "border-indigo-100 bg-indigo-50/60 text-indigo-900",
  },
  health: {
    header: "bg-gradient-to-br from-purple-700 via-purple-600 to-violet-700",
    description: "text-purple-50/90",
    chip: "bg-purple-50 text-purple-700 ring-purple-100",
    badge: "bg-purple-600",
    button: "bg-purple-700 hover:bg-purple-800",
    accentText: "text-purple-700",
    accentPanel: "border-purple-100 bg-purple-50/60 text-purple-900",
  },
  feed: {
    header: "bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-700",
    description: "text-emerald-50/90",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badge: "bg-emerald-600",
    button: "bg-emerald-700 hover:bg-emerald-800",
    accentText: "text-emerald-700",
    accentPanel: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
  },
  flock: {
    header: "bg-gradient-to-br from-sky-700 via-sky-600 to-blue-700",
    description: "text-sky-50/90",
    chip: "bg-sky-50 text-sky-700 ring-sky-100",
    badge: "bg-sky-600",
    button: "bg-sky-700 hover:bg-sky-800",
    accentText: "text-sky-700",
    accentPanel: "border-sky-100 bg-sky-50/60 text-sky-900",
  },
  sales: {
    header: "bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600",
    description: "text-amber-50/90",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    badge: "bg-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
    accentText: "text-amber-700",
    accentPanel: "border-amber-100 bg-amber-50/60 text-amber-900",
  },
  schedule: {
    header: "bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700",
    description: "text-teal-50/90",
    chip: "bg-teal-50 text-teal-700 ring-teal-100",
    badge: "bg-teal-600",
    button: "bg-teal-700 hover:bg-teal-800",
    accentText: "text-teal-700",
    accentPanel: "border-teal-100 bg-teal-50/60 text-teal-900",
  },
  settings: {
    header: "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
    description: "text-slate-200",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    badge: "bg-slate-700",
    button: "bg-slate-800 hover:bg-slate-900",
    accentText: "text-slate-700",
    accentPanel: "border-slate-200 bg-slate-50 text-slate-900",
  },
  report: {
    header: "bg-gradient-to-br from-cyan-700 via-cyan-600 to-sky-700",
    description: "text-cyan-50/90",
    chip: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    badge: "bg-cyan-600",
    button: "bg-cyan-700 hover:bg-cyan-800",
    accentText: "text-cyan-700",
    accentPanel: "border-cyan-100 bg-cyan-50/60 text-cyan-900",
  },
  danger: {
    header: "bg-gradient-to-br from-rose-700 via-rose-600 to-red-700",
    description: "text-rose-50/90",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    badge: "bg-rose-600",
    button: "bg-rose-600 hover:bg-rose-700",
    accentText: "text-rose-700",
    accentPanel: "border-rose-100 bg-rose-50/60 text-rose-900",
  },
}

export const modalTone = (tone: ModalTone): ToneClasses => TONES[tone]

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-7xl",
} as const

export type ModalSize = keyof typeof SIZES

const ToneContext = React.createContext<ModalTone>("inventory")

type FormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  tone?: ModalTone
  size?: ModalSize
  /** When provided, the body and footer are wrapped in a form that calls this on submit. */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  footer?: React.ReactNode
  /** Prevents closing (overlay, escape, close button) while work is in progress. */
  busy?: boolean
  /** Prevents closing by clicking outside or pressing escape (e.g. long data-entry forms). */
  dismissible?: boolean
  bodyClassName?: string
  className?: string
  children?: React.ReactNode
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  tone = "inventory",
  size = "lg",
  onSubmit,
  footer,
  busy = false,
  dismissible = true,
  bodyClassName,
  className,
  children,
}: FormModalProps) {
  const t = TONES[tone]

  const body = (
    <>
      <div
        className={cn(
          "min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer ? (
        <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          {footer}
        </DialogFooter>
      ) : null}
    </>
  )

  return (
    <ToneContext.Provider value={tone}>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && busy) return
          onOpenChange(next)
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[92vh] w-full flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:hover:text-white",
            SIZES[size],
            className,
          )}
          onPointerDownOutside={(e) => {
            if (busy || !dismissible) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (busy || !dismissible) e.preventDefault()
          }}
        >
          <div className={cn("relative shrink-0 overflow-hidden px-6 py-5 text-white", t.header)}>
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 35%)",
              }}
            />
            <DialogHeader className="relative space-y-1 text-left">
              {Icon ? (
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <Icon className="h-5 w-5" />
                </div>
              ) : null}
              <DialogTitle className="pr-8 text-xl font-semibold tracking-tight text-white">{title}</DialogTitle>
              {description ? (
                <DialogDescription className={cn("text-sm", t.description)}>{description}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{typeof title === "string" ? title : "Dialog"}</DialogDescription>
              )}
            </DialogHeader>
          </div>

          {onSubmit ? (
            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              {body}
            </form>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">{body}</div>
          )}
        </DialogContent>
      </Dialog>
    </ToneContext.Provider>
  )
}

type FormSectionProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  step?: number
  /** Optional element rendered at the right of the section header (e.g. a toggle or badge). */
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function FormSection({ title, description, icon: Icon, step, action, className, children }: FormSectionProps) {
  const t = TONES[React.useContext(ToneContext)]
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm ring-1 ring-slate-900/[0.02] sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
        {Icon || step ? (
          <span className={cn("relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", t.chip)}>
            {Icon ? <Icon className="h-4 w-4" /> : <span className="text-sm font-semibold">{step}</span>}
            {Icon && step ? (
              <span
                className={cn(
                  "absolute -right-1.5 -top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                  t.badge,
                )}
              >
                {step}
              </span>
            ) : null}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

type FormFieldProps = {
  label: React.ReactNode
  htmlFor?: string
  required?: boolean
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function FormField({ label, htmlFor, required, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

/** Shared look for Input / SelectTrigger inside modals. */
export const formInputClass = (invalid?: boolean, extra?: string) =>
  cn(
    "h-10 rounded-xl border-slate-200 bg-slate-50/60 transition focus-visible:bg-white",
    invalid && "border-rose-300 focus-visible:ring-rose-200",
    extra,
  )

/** Shared look for Textarea inside modals. */
export const formTextareaClass = (invalid?: boolean, extra?: string) =>
  cn(
    "min-h-[80px] resize-none rounded-xl border-slate-200 bg-slate-50/60 transition focus-visible:bg-white",
    invalid && "border-rose-300 focus-visible:ring-rose-200",
    extra,
  )

/** Highlighted summary row (e.g. totals) in the modal's accent colour. */
export function FormSummary({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  const t = TONES[React.useContext(ToneContext)]
  return (
    <div className={cn("flex items-center justify-between rounded-xl border px-3 py-2 text-sm", t.accentPanel, className)}>
      <span className={t.accentText}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

type ModalFooterActionsProps = {
  onCancel: () => void
  cancelLabel?: string
  submitLabel: React.ReactNode
  busyLabel?: React.ReactNode
  busy?: boolean
  disabled?: boolean
  /** "submit" when inside FormModal with onSubmit; otherwise pass onConfirm. */
  submitType?: "submit" | "button"
  onConfirm?: () => void
  tone?: ModalTone
  icon?: React.ComponentType<{ className?: string }>
  /** Extra controls rendered at the left of the footer. */
  leading?: React.ReactNode
}

export function ModalFooterActions({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel,
  busyLabel,
  busy = false,
  disabled = false,
  submitType = "submit",
  onConfirm,
  tone,
  icon: Icon,
  leading,
}: ModalFooterActionsProps) {
  const ctxTone = React.useContext(ToneContext)
  const t = TONES[tone ?? ctxTone]
  return (
    <>
      {leading ? <div className="mr-auto flex items-center gap-2">{leading}</div> : null}
      <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="rounded-xl">
        {cancelLabel}
      </Button>
      <Button
        type={submitType}
        onClick={submitType === "button" ? onConfirm : undefined}
        disabled={busy || disabled}
        className={cn("rounded-xl text-white", t.button)}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {busyLabel ?? submitLabel}
          </>
        ) : (
          <>
            {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
            {submitLabel}
          </>
        )}
      </Button>
    </>
  )
}

type ConfirmModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  tone?: ModalTone
  confirmLabel?: React.ReactNode
  busyLabel?: React.ReactNode
  cancelLabel?: string
  showCancel?: boolean
  busy?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  confirmIcon?: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  icon = AlertTriangle,
  tone = "danger",
  confirmLabel = "Confirm",
  busyLabel,
  cancelLabel = "Cancel",
  showCancel = true,
  busy = false,
  confirmDisabled = false,
  onConfirm,
  confirmIcon,
  children,
}: ConfirmModalProps) {
  const t = TONES[tone]
  const ConfirmIcon = confirmIcon
  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size="sm"
      busy={busy}
      bodyClassName={children ? undefined : "hidden"}
      footer={
        <>
          {showCancel ? (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="rounded-xl">
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={cn("rounded-xl text-white", t.button)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {busyLabel ?? confirmLabel}
              </>
            ) : (
              <>
                {ConfirmIcon ? <ConfirmIcon className="mr-2 h-4 w-4" /> : null}
                {confirmLabel}
              </>
            )}
          </Button>
        </>
      }
    >
      {children}
    </FormModal>
  )
}
