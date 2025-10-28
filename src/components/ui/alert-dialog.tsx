import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

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
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getButtonVariant = () => {
    switch (type) {
      case "success":
        return "default"
      case "error":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "default"
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          {showCancel && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button variant={getButtonVariant()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}