import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { AlertTriangle, HelpCircle, PencilLine } from "lucide-react"
import { ConfirmModal, FormField, formInputClass } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { currentDialog, settleDialog, subscribeDialogs, type PromptOptions } from "@/lib/confirmDialog"

/** Renders confirmDialog() / promptDialog() requests from src/lib/confirmDialog.ts. Mount once at the app root. */
export function ConfirmDialogHost() {
  const req = useSyncExternalStore(subscribeDialogs, currentDialog, currentDialog)
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (req?.kind === "prompt") {
      setValue(req.options.defaultValue ?? "")
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }, [req])

  if (!req) return null
  const o = req.options
  const isPrompt = req.kind === "prompt"
  const required = isPrompt && (req.options as PromptOptions).required !== false
  const tone = o.tone ?? (isPrompt ? "settings" : "danger")
  const icon = o.icon ?? (isPrompt ? PencilLine : tone === "danger" ? AlertTriangle : HelpCircle)

  const confirm = () => {
    if (isPrompt) {
      if (required && !value.trim()) return
      settleDialog(value)
    } else {
      settleDialog(true)
    }
  }

  return (
    <ConfirmModal
      open
      onOpenChange={(open) => {
        if (!open) settleDialog(isPrompt ? null : false)
      }}
      title={o.title}
      description={o.description}
      tone={tone}
      icon={icon}
      confirmLabel={o.confirmLabel ?? (isPrompt ? "OK" : "Confirm")}
      cancelLabel={o.cancelLabel ?? "Cancel"}
      confirmDisabled={required && !value.trim()}
      onConfirm={confirm}
    >
      {isPrompt ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            confirm()
          }}
        >
          <FormField label={(req.options as PromptOptions).label ?? ""}>
            <Input
              ref={inputRef}
              autoFocus
              value={value}
              placeholder={(req.options as PromptOptions).placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={formInputClass()}
            />
          </FormField>
        </form>
      ) : null}
    </ConfirmModal>
  )
}
