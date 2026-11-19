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
  } = usePurchaseOrderForm({
    poId: parsedPoId,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const activeLine = lines.find(l => l.id === activeLineId)
  const selectedTyre = tyres.find(t => t.Id === activeLine?.TyreID)
  const tyreLabel = selectedTyre ? `${selectedTyre.Brand} / ${selectedTyre.Size} / ${selectedTyre.Pattern}` : ""

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
          state={{ formData, lines, tyres, initializing, submitting, error }} 
          actions={{ 
            onChangeDate: (val) => updateField("Date", val),
            onAddLine: addLine,
            onRemoveLine: removeLine,
            onUpdateLine: updateLine,
            onOpenSupplierModal: setActiveLineId,
            onSubmit: handleSubmit,
            onCancel: () => navigate("/purchase-orders")
          }} 
        />

        {activeLine && (
          <SupplierSelectionModal
            isOpen={!!activeLineId}
            onClose={() => setActiveLineId(null)}
            tyreId={activeLine.TyreID}
            tyreLabel={tyreLabel}
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