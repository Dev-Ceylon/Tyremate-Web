import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePurchaseOrderForm, type PurchaseOrderLineSupplier } from "./usePurchaseOrderForm"

export function usePurchaseOrderCreate(inquiryId: number | null = null) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeLineId, setActiveLineId] = useState<string | null>(null)

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "Purchase order created",
      message: "The purchase order was saved successfully.",
    })
    if (inquiryId) {
      navigate(`/inquiries/${inquiryId}`)
    } else {
      navigate("/purchase-orders")
    }
  }, [navigate, showToast, inquiryId])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: "Failed to create purchase order",
      message,
    })
  }, [showToast])

  const {
    formData,
    lines,
    tyres,
    initializing,
    submitting,
    error,
    updateField,
    addLine,
    removeLine,
    updateLine,
    setLineSuppliers,
    handleSubmit,
    reloadTyres,
    selectTyreForOrder,
  } = usePurchaseOrderForm({
    inquiryId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const activeLine = useMemo(() => lines.find((l) => l.id === activeLineId), [lines, activeLineId])

  const activeTyre = useMemo(() => tyres.find((t) => t.Id === activeLine?.TyreID), [tyres, activeLine])

  const tyreLabel = useMemo(
    () => (activeTyre ? `${activeTyre.Brand} / ${activeTyre.Size} / ${activeTyre.Pattern}` : ""),
    [activeTyre],
  )

  const handleOpenSupplierModal = useCallback((lineId: string) => {
    setActiveLineId(lineId)
  }, [])

  const handleCloseSupplierModal = useCallback(() => {
    setActiveLineId(null)
  }, [])

  const handleConfirmSuppliers = useCallback(
    (suppliers: PurchaseOrderLineSupplier[]) => {
      if (activeLineId) {
        setLineSuppliers(activeLineId, suppliers)
      }
    },
    [activeLineId, setLineSuppliers],
  )

  return {
    formState: { formData, lines, tyres, initializing, submitting, error },
    formActions: {
      onChangeDate: (val: string) => updateField("Date", val),
      onAddLine: addLine,
      onRemoveLine: removeLine,
      onUpdateLine: updateLine,
      onOpenSupplierModal: handleOpenSupplierModal,
      onSubmit: handleSubmit,
      onCancel: () => (inquiryId ? navigate(`/inquiries/${inquiryId}`) : navigate("/purchase-orders")),
      reloadTyres,
      selectTyreForOrder,
    },
    modalState: { isOpen: !!activeLineId, activeLine, tyreLabel },
    modalActions: {
      onClose: handleCloseSupplierModal,
      onConfirm: handleConfirmSuppliers,
    },
  }
}
