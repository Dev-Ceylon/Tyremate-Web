import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { purchaseOrderService } from "../services/purchaseOrderService"

export function useDeletePurchaseOrder(poId: number | null) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!poId) return

    const confirmed = await confirm({
      title: "Delete Purchase Order",
      message: `Delete PO #${poId}? This action cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    })

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    try {
      await purchaseOrderService.deletePurchaseOrder(poId)
      showToast({
        variant: "success",
        title: "Purchase order deleted",
        message: `PO #${poId} was removed successfully.`,
      })
      navigate("/purchase-orders")
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: err.message || "Failed to delete purchase order",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return { isDeleting, handleDelete }
}