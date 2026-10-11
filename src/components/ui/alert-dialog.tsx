import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { ConfirmModal, type ModalTone } from "./form-modal"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  type?: "success" | "error" | "warning" | "info"
  confirmText?: string
  onConfirm?: () => void
  showCancel?: boolean
}

const TYPE_STYLE: Record<NonNullable<AlertDialogProps["type"]>, { tone: ModalTone; icon: typeof Info }> = {
  success: { tone: "feed", icon: CheckCircle },
  error: { tone: "danger", icon: XCircle },
  warning: { tone: "sales", icon: AlertTriangle },
  info: { tone: "flock", icon: Info },
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  type = "info",
  confirmText = "OK",
  onConfirm,
  showCancel = false,
}: AlertDialogProps) {
  const { tone, icon } = TYPE_STYLE[type]

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <ConfirmModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      confirmLabel={confirmText}
      showCancel={showCancel}
      onConfirm={handleConfirm}
    />
  )
}
