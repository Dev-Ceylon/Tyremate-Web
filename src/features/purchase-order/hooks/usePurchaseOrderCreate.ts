import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePurchaseOrderForm, type PurchaseOrderLineSupplier } from "./usePurchaseOrderForm"
import type { POCategory } from "@/shared/constants/poCategoryConstants"

export function usePurchaseOrderCreate(inquiryId: number | null = null, initialCategory: POCategory = "tyre") {
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
    category,
    setCategory,
    formData,
    lines,
    tyres,
    batteries,
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
    reloadBatteries,
    selectTyreForOrder,
    selectBatteryForOrder,
  } = usePurchaseOrderForm({
    inquiryId,
    initialCategory,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const activeLine = useMemo(() => lines.find((l) => l.id === activeLineId), [lines, activeLineId])

  const activeTyre = useMemo(() => tyres.find((t) => t.Id === activeLine?.TyreID), [tyres, activeLine])
  const activeBattery = useMemo(() => batteries.find((b) => b.Id === activeLine?.BatteryID), [batteries, activeLine])

  const itemLabel = useMemo(() => {
    if (category === "battery") {
      if (!activeBattery) return ""
      const details = [activeBattery.Model, activeBattery.Voltage, activeBattery.Capacity].filter(Boolean).join(" - ")
      return details ? `${activeBattery.Brand} (${details})` : activeBattery.Brand || `Battery #${activeBattery.Id}`
    }
    return activeTyre ? `${activeTyre.Brand} / ${activeTyre.Size} / ${activeTyre.Pattern}` : ""
  }, [category, activeTyre, activeBattery])

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
    formState: { category, setCategory, formData, lines, tyres, batteries, initializing, submitting, error },
    formActions: {
      onChangeDate: (val: string) => updateField("Date", val),
      onAddLine: addLine,
      onRemoveLine: removeLine,
      onUpdateLine: updateLine,
      onOpenSupplierModal: handleOpenSupplierModal,
      onSubmit: handleSubmit,
      onCancel: () => (inquiryId ? navigate(`/inquiries/${inquiryId}`) : navigate("/purchase-orders")),
      reloadTyres,
      reloadBatteries,
      selectTyreForOrder,
      selectBatteryForOrder,
    },
    modalState: {
      isOpen: !!activeLineId,
      activeLine,
      category,
      itemId: activeLine?.BatteryID || activeLine?.TyreID,
      itemLabel,
      tyreLabel: itemLabel,
    },
    modalActions: {
      onClose: handleCloseSupplierModal,
      onConfirm: handleConfirmSuppliers,
    },
  }
}
