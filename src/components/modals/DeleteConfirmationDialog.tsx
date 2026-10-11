import { Trash2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/form-modal"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading?: boolean
  itemName?: string
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  isLoading = false,
  itemName
}: DeleteConfirmationDialogProps) => {
  const defaultDescription = `Are you sure you want to delete ${itemName ? `"${itemName}"` : 'this item'}? This action cannot be undone and will restore the vaccine inventory.`

  return (
    <ConfirmModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description || defaultDescription}
      icon={Trash2}
      tone="danger"
      busy={isLoading}
      confirmLabel="Delete"
      busyLabel="Deleting..."
      confirmIcon={Trash2}
      onConfirm={onConfirm}
    />
  )
}

export default DeleteConfirmationDialog
