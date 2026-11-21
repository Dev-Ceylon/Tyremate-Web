import { useState, useCallback } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { PurchaseOrderForm } from "../components/PurchaseOrderForm"
import { SupplierSelectionModal } from "../components/SupplierSelectionModal"
import { usePurchaseOrderForm } from "../hooks/usePurchaseOrderForm"
import { useToast } from "../../../shared/ui/toast/ToastProvider"

export default function PurchaseOrderEditPage() {
  const navigate = useNavigate()
  const { poId } = useParams()
  const { showToast } = useToast()
  const parsedPoId = poId ? Number(poId) : undefined

  const handleSuccess = useCallback(() => {
    showToast({
      variant: "success",
      title: "Purchase order updated",
      message: "The purchase order was saved successfully.",
    })
    navigate("/purchase-orders")
  }, [navigate, showToast])

  const handleError = useCallback((message: string) => {
    showToast({
      variant: "error",
      title: "Failed to update purchase order",
      message,
    })
  }, [showToast])

  const {
    category,
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
  } = usePurchaseOrderForm({
    poId: parsedPoId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const activeLine = lines.find((l) => l.id === activeLineId)
  const selectedTyre = tyres.find((t) => t.Id === activeLine?.TyreID)
  const selectedBattery = batteries.find((b) => b.Id === activeLine?.BatteryID)

  const itemLabel =
    category === "battery"
      ? selectedBattery
        ? `${selectedBattery.Brand} ${selectedBattery.Model || ""} (${selectedBattery.Capacity || ""} ${selectedBattery.Voltage || ""})`
        : ""
      : selectedTyre
        ? `${selectedTyre.Brand} / ${selectedTyre.Size} / ${selectedTyre.Pattern}`
        : ""

  return (
    <main className="app-shell">
      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Purchase Order</p>
            <h2>Edit Purchase Order #{poId}</h2>
          </div>
        </div>

        {initializing ? <p className="hero-text">Loading order details...</p> : null}
        {error ? <p className="hero-text error-text">{error}</p> : null}

        <PurchaseOrderForm
          isEditMode={true}
          state={{ category, formData, lines, tyres, batteries, initializing, submitting, error }}
          actions={{
            onChangeDate: (val) => updateField("Date", val),
            onAddLine: addLine,
            onRemoveLine: removeLine,
            onUpdateLine: updateLine,
            onOpenSupplierModal: setActiveLineId,
            onSubmit: handleSubmit,
            onCancel: () => navigate("/purchase-orders"),
          }}
        />

        {activeLine && (
          <SupplierSelectionModal
            isOpen={!!activeLineId}
            onClose={() => setActiveLineId(null)}
            category={category}
            itemId={activeLine.BatteryID || activeLine.TyreID}
            itemLabel={itemLabel}
            tyreId={activeLine.TyreID}
            batteryId={activeLine.BatteryID}
            tyreLabel={itemLabel}
            lineQty={activeLine.Qty}
            existingSuppliers={activeLine.Suppliers}
            onConfirm={(suppliers) => {
              setLineSuppliers(activeLine.id, suppliers)
              setActiveLineId(null)
            }}
          />
        )}
      </section>
    </main>
  )
}