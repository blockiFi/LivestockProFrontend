/**
 * In-app replacement for window.confirm / window.prompt.
 *
 *   if (!(await confirmDialog({ title: "Delete invoice?", confirmLabel: "Delete" }))) return
 *   const name = await promptDialog({ title: "Template title" })
 *
 * <ConfirmDialogHost /> (mounted once in main.tsx) renders the requests.
 */
import type { ComponentType, ReactNode } from "react"
import type { ModalTone } from "@/components/ui/form-modal"

export type ConfirmOptions = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" (default) for destructive actions; any modal tone otherwise. */
  tone?: ModalTone
  icon?: ComponentType<{ className?: string }>
}

export type PromptOptions = ConfirmOptions & {
  label?: string
  defaultValue?: string
  placeholder?: string
  /** When true, an empty answer disables the confirm button. Default true. */
  required?: boolean
}

export type DialogRequest =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }

let queue: DialogRequest[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
export const subscribeDialogs = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const currentDialog = () => queue[0] ?? null

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    queue = [...queue, { kind: "confirm", options, resolve }]
    emit()
  })
}

export function promptDialog(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    queue = [...queue, { kind: "prompt", options, resolve }]
    emit()
  })
}

export function settleDialog(value: boolean | string | null) {
  const req = queue[0]
  if (!req) return
  queue = queue.slice(1)
  if (req.kind === "confirm") req.resolve(value === true)
  else req.resolve(typeof value === "string" ? value : null)
  emit()
}

